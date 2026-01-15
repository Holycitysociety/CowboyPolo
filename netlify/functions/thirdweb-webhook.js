// netlify/functions/thirdweb-webhook.js
// Fulfill PATRON transfers from thirdweb Bridge webhooks
// Handles BOTH pay.onchain-transaction and pay.onramp-transaction
// Canonical source of truth is the *actual* delivered USDC amount.

const crypto = require("crypto");
const { ethers } = require("ethers");

// -----------------------------
// ethers helpers (v5/v6 safe)
// -----------------------------
function getProvider(rpcUrl) {
  if (!rpcUrl) throw new Error("RPC_URL env var is missing");
  if (ethers.JsonRpcProvider) return new ethers.JsonRpcProvider(rpcUrl); // v6
  if (ethers.providers?.JsonRpcProvider)
    return new ethers.providers.JsonRpcProvider(rpcUrl); // v5
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
// Per thirdweb docs: signature over `${timestamp}.${rawBody}`
// -----------------------------
function verifyThirdwebWebhook(
  rawBody,
  headers,
  secret,
  toleranceSeconds = 300
) {
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
    throw new Error(
      `Webhook timestamp too old (diff=${diff}s, tol=${toleranceSeconds}s)`
    );
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
// Best-effort in-memory idempotency
// -----------------------------
const processed = global.__PROCESSED_PAYMENTS__ || new Set();
global.__PROCESSED_PAYMENTS__ = processed;

// -----------------------------
// Lambda handler
// -----------------------------
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const RPC_URL = process.env.RPC_URL;
  const WEBHOOK_SECRET = process.env.THIRDWEB_WEBHOOK_SECRET;

  // Destination (what thirdweb delivers)
  const DEST_CHAIN_ID = Number(process.env.DEST_CHAIN_ID || "8453"); // Base
  const USDC_ADDRESS =
    process.env.USDC_TOKEN_ADDRESS ||
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
  const SELLER_ADDRESS = process.env.SELLER_ADDRESS; // must match CheckoutWidget `seller`

  // Fulfillment (what we send)
  const PATRON_TOKEN_ADDRESS = process.env.PATRON_TOKEN_ADDRESS;
  const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
  const PATRON_DECIMALS = Number(process.env.PATRON_DECIMALS || "18");
  const USDC_DECIMALS = Number(process.env.USDC_DECIMALS || "6");

  //  how many PATRON per 1 USD / 1 USDC
  const PATRON_PER_USD = process.env.PATRON_PER_USD
    ? String(process.env.PATRON_PER_USD)
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

    const isOnchain = type === "pay.onchain-transaction";
    const isOnramp = type === "pay.onramp-transaction";

    if (!isOnchain && !isOnramp) {
      // Not our event, ignore
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, ignored: true, type }),
      };
    }

    if (!data) {
      throw new Error("Missing data in webhook payload");
    }

    if (data.status !== "COMPLETED") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          ignored: true,
          status: data.status,
          type,
        }),
      };
    }

    // 3) Normalize fields between onchain & onramp
    const receiver = data.receiver;
    const sender = isOnchain
      ? data.sender
      : data.sender || data.receiver; // onramp sender is optional

    const destToken = isOnchain ? data.destinationToken : data.token;
    const destinationAmount = isOnchain
      ? data.destinationAmount
      : data.amount; // bigint-ish string

    if (!isAddress(receiver) || !isAddress(sender)) {
      throw new Error(
        `Invalid sender/receiver in payload: sender=${sender} receiver=${receiver}`
      );
    }

    if (
      SELLER_ADDRESS &&
      normalizeAddress(receiver) !== normalizeAddress(SELLER_ADDRESS)
    ) {
      throw new Error(
        `Receiver mismatch. Got ${receiver}, expected ${SELLER_ADDRESS}`
      );
    }

    if (
      !destToken?.address ||
      normalizeAddress(destToken.address) !== normalizeAddress(USDC_ADDRESS)
    ) {
      throw new Error(
        `Destination token mismatch. Got ${destToken?.address}, expected ${USDC_ADDRESS}`
      );
    }

    if (Number(destToken.chainId) !== DEST_CHAIN_ID) {
      throw new Error(
        `Destination chain mismatch. Got ${destToken.chainId}, expected ${DEST_CHAIN_ID}`
      );
    }

    if (!destinationAmount || BigInt(destinationAmount) <= 0n) {
      throw new Error(`Invalid destinationAmount/amount: ${destinationAmount}`);
    }

    // 4) Idempotency key
    const paymentId =
      data.paymentId || data.transactionId || data.id || null;
    if (paymentId) {
      if (processed.has(paymentId)) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            ok: true,
            duplicate: true,
            paymentId,
          }),
        };
      }
      processed.add(paymentId);
    }

    // 5) Compute PATRON from actual USDC delivered
    const usdcBase = BigInt(destinationAmount);

    if (PATRON_DECIMALS < USDC_DECIMALS) {
      throw new Error(
        "PATRON_DECIMALS must be >= USDC_DECIMALS for this fulfillment math"
      );
    }

    // Bring USDC amount up to PATRON decimals
    const scale = 10n ** BigInt(PATRON_DECIMALS - USDC_DECIMALS);
    const usdcAsPatronDecimals = usdcBase * scale;

    // Multiply by rate using 18-dec fixed point
    const RATE_DECIMALS = 18;
    const rateWei = ethers.parseUnits
      ? ethers.parseUnits(PATRON_PER_USD, RATE_DECIMALS)
      : ethers.utils.parseUnits(PATRON_PER_USD, RATE_DECIMALS);

    const rateWeiBig = BigInt(rateWei.toString());
    const patronWei =
      (usdcAsPatronDecimals * rateWeiBig) /
      (10n ** BigInt(RATE_DECIMALS));

    if (patronWei <= 0n) {
      throw new Error("Computed patronWei is zero");
    }

    // 6) Transfer PATRON from treasury → buyer
    if (!PATRON_TOKEN_ADDRESS || !TREASURY_PRIVATE_KEY) {
      throw new Error(
        "Server misconfigured: missing PATRON_TOKEN_ADDRESS or TREASURY_PRIVATE_KEY"
      );
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

    const patron = new ethers.Contract(
      PATRON_TOKEN_ADDRESS,
      patronAbi,
      signer
    );

    const treasuryAddr =
      (await signer.getAddress?.()) || signer.address;
    const treasuryBal = await patron.balanceOf(treasuryAddr);
    const treasuryBalBig = BigInt(treasuryBal.toString());

    if (treasuryBalBig < patronWei) {
      throw new Error("Treasury insufficient PATRON balance for fulfillment");
    }

    const tx = await patron.transfer(sender, patronWei);
    const receipt = await tx.wait();

    console.log(
      `Fulfilled PATRON: paymentId=${paymentId}, to=${sender}, usdc=${destinationAmount}, patronWei=${patronWei.toString()}, tx=${receipt.transactionHash}`
    );

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
      body: JSON.stringify({
        error: "Webhook processing failed",
        message: err.message || String(err),
        stack: err.stack || null,
      }),
    };
  }
};