// netlify/functions/thirdweb-webhook.js
// Fulfills PATRON transfers from thirdweb Bridge Webhooks
// Handles both: pay.onchain-transaction + pay.onramp-transaction

const crypto = require("crypto");
const { ethers } = require("ethers");

// -----------------------------
// Helpers (ethers v5/v6)
// -----------------------------
function getProvider(rpcUrl) {
  if (!rpcUrl) throw new Error("RPC_URL env var is missing");
  if (ethers.JsonRpcProvider) return new ethers.JsonRpcProvider(rpcUrl); // v6
  if (ethers.providers?.JsonRpcProvider) return new ethers.providers.JsonRpcProvider(rpcUrl); // v5
  throw new Error("No JsonRpcProvider found on ethers");
}

function isAddress(addr) {
  if (ethers.isAddress) return ethers.isAddress(addr); // v6
  if (ethers.utils?.isAddress) return ethers.utils.isAddress(addr); // v5
  throw new Error("No isAddress helper on ethers");
}

function normalizeAddress(addr) {
  return String(addr || "").toLowerCase();
}

// -----------------------------
// Webhook signature verification (HMAC SHA-256)
// Signature over `${timestamp}.${rawBody}`
// -----------------------------
function verifyThirdwebWebhook(rawBody, headers, secret, toleranceSeconds = 300) {
  if (!secret) throw new Error("Missing THIRDWEB_WEBHOOK_SECRET env var");

  const signature =
    headers["x-payload-signature"] ||
    headers["x-pay-signature"] ||
    headers["X-Payload-Signature"] ||
    headers["X-Pay-Signature"];

  const ts =
    headers["x-timestamp"] ||
    headers["x-pay-timestamp"] ||
    headers["X-Timestamp"] ||
    headers["X-Pay-Timestamp"];

  if (!signature || !ts) {
    throw new Error("Missing webhook signature or timestamp headers");
  }

  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(ts, 10);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid timestamp header");

  const diff = Math.abs(now - timestamp);
  if (diff > toleranceSeconds) {
    throw new Error(`Webhook timestamp too old (diff=${diff}s, tol=${toleranceSeconds}s)`);
  }

  const computed = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (computed !== signature) {
    throw new Error("Invalid webhook signature");
  }

  return true;
}

// -----------------------------
// Minimal in-memory idempotency
// -----------------------------
const processed = global.__PROCESSED_PAYMENTS__ || new Set();
global.__PROCESSED_PAYMENTS__ = processed;

// -----------------------------
// Handler
// -----------------------------
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const RPC_URL = process.env.RPC_URL;
  const WEBHOOK_SECRET = process.env.THIRDWEB_WEBHOOK_SECRET;

  // Destination verification (what you expect thirdweb to deliver)
  const DEST_CHAIN_ID = Number(process.env.DEST_CHAIN_ID || "8453"); // Base
  const USDC_ADDRESS =
    process.env.USDC_TOKEN_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const SELLER_ADDRESS = process.env.SELLER_ADDRESS; // optional extra safety

  // Fulfillment (what you send)
  const PATRON_TOKEN_ADDRESS = process.env.PATRON_TOKEN_ADDRESS;
  const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
  const PATRON_DECIMALS = Number(process.env.PATRON_DECIMALS || "18");
  const USDC_DECIMALS = Number(process.env.USDC_DECIMALS || "6");
  const PATRON_PER_USDC = process.env.PATRON_PER_USDC
    ? String(process.env.PATRON_PER_USDC)
    : "1";

  try {
    const rawBody = event.body || "";
    const headers = event.headers || {};

    // 1) Verify authenticity
    verifyThirdwebWebhook(rawBody, headers, WEBHOOK_SECRET, 300);

    // 2) Parse payload
    const payload = JSON.parse(rawBody);
    const type = payload?.type;
    const data = payload?.data;

    if (!data) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, ignored: true }) };
    }

    // -----------------------------
    // Normalize onchain vs onramp
    // -----------------------------
    let receiver;
    let sender;
    let destToken;
    let destinationAmount; // string in smallest units
    let paymentId = null;

    if (type === "pay.onchain-transaction") {
      // Old path (bridge / swap)
      if (data.status !== "COMPLETED") {
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, ignored: true, status: data.status }),
        };
      }

      receiver = data.receiver;
      sender = data.sender;
      destToken = data.destinationToken;
      destinationAmount = data.destinationAmount;
      paymentId = data.paymentId || data.transactionId || null;
    } else if (type === "pay.onramp-transaction") {
      // Fiat on-ramp (what you're actually seeing in thirdweb dashboard)
      if (data.status !== "COMPLETED") {
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, ignored: true, status: data.status }),
        };
      }

      // OnrampTransaction shape:
      // { amount, currency, currencyAmount, id, onramp, receiver, sender?, token, status, transactionHash? }
      receiver = data.receiver;
      sender = data.sender || data.receiver; // we credit PATRON to the wallet that received USDC
      destToken = data.token;
      destinationAmount = data.amount; // already in base units
      paymentId = data.id || data.transactionHash || null;
    } else {
      // Some other event type – ignore
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, ignored: true, type }),
      };
    }

    // -----------------------------
    // 3) Verify destination constraints
    // -----------------------------
    if (!isAddress(receiver)) {
      throw new Error(`Invalid receiver in payload: receiver=${receiver}`);
    }
    if (!sender || !isAddress(sender)) {
      // For onramp, sender can be empty/null – in that case we just treat receiver as buyer
      sender = receiver;
    }

    if (SELLER_ADDRESS && normalizeAddress(receiver) !== normalizeAddress(SELLER_ADDRESS)) {
      throw new Error(`Receiver mismatch. Got ${receiver}, expected ${SELLER_ADDRESS}`);
    }

    if (
      !destToken?.address ||
      normalizeAddress(destToken.address) !== normalizeAddress(USDC_ADDRESS)
    ) {
      throw new Error(`Destination token mismatch. Got ${destToken?.address}, expected ${USDC_ADDRESS}`);
    }

    if (Number(destToken.chainId) !== DEST_CHAIN_ID) {
      throw new Error(`Destination chain mismatch. Got ${destToken.chainId}, expected ${DEST_CHAIN_ID}`);
    }

    if (!destinationAmount || BigInt(destinationAmount) <= 0n) {
      throw new Error(`Invalid destinationAmount: ${destinationAmount}`);
    }

    // -----------------------------
    // 4) Idempotency
    // -----------------------------
    if (paymentId) {
      if (processed.has(paymentId)) {
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, duplicate: true, paymentId }),
        };
      }
      processed.add(paymentId);
    }

    // -----------------------------
    // 5) Compute PATRON from actual USDC
    // -----------------------------
    const usdcBase = BigInt(destinationAmount);

    if (PATRON_DECIMALS < USDC_DECIMALS) {
      throw new Error("PATRON_DECIMALS must be >= USDC_DECIMALS for this fulfillment math");
    }

    const scale = 10n ** BigInt(PATRON_DECIMALS - USDC_DECIMALS);
    const usdcAsPatronDecimals = usdcBase * scale;

    const RATE_DECIMALS = 18;
    const rateWei =
      ethers.parseUnits?.(PATRON_PER_USDC, RATE_DECIMALS) ??
      ethers.utils.parseUnits(PATRON_PER_USDC, RATE_DECIMALS);

    const rateWeiBig = BigInt(rateWei.toString());
    const patronWei =
      (usdcAsPatronDecimals * rateWeiBig) / (10n ** BigInt(RATE_DECIMALS));

    if (patronWei <= 0n) {
      throw new Error("Computed patronWei is zero");
    }

    // -----------------------------
    // 6) Transfer PATRON from treasury -> buyer (sender)
    // -----------------------------
    if (!PATRON_TOKEN_ADDRESS || !TREASURY_PRIVATE_KEY) {
      throw new Error("Server misconfigured: missing PATRON_TOKEN_ADDRESS or TREASURY_PRIVATE_KEY");
    }

    const provider = getProvider(RPC_URL);
    let signer = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

    if (ethers.NonceManager) {
      signer = new ethers.NonceManager(signer);
    }

    const patronAbi = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
    ];

    const patron = new ethers.Contract(PATRON_TOKEN_ADDRESS, patronAbi, signer);

    const signerAddress = (await signer.getAddress?.()) || signer.address;
    const treasuryBal = await patron.balanceOf(signerAddress);
    const treasuryBalBig = BigInt(treasuryBal.toString());

    if (treasuryBalBig < patronWei) {
      throw new Error("Treasury insufficient PATRON balance for fulfillment");
    }

    const tx = await patron.transfer(sender, patronWei);
    const receipt = await tx.wait();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        type,
        paymentId,
        to: sender,
        usdcDestinationAmount: destinationAmount,
        patronWei: patronWei.toString(),
        fulfillmentTxHash: receipt.transactionHash,
      }),
    };
  } catch (err) {
    console.error("thirdweb-webhook fulfillment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Webhook processing failed" }),
    };
  }
};