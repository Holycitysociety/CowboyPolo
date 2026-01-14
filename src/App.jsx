// netlify/functions/mint-patron.js
const { ethers } = require("ethers");

// Helpers to support both ethers v5 and v6
function getProvider(rpcUrl) {
  if (!rpcUrl) {
    throw new Error("RPC_URL env var is missing");
  }

  // ethers v6
  if (ethers.JsonRpcProvider) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  // ethers v5
  if (ethers.providers && ethers.providers.JsonRpcProvider) {
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  throw new Error("No JsonRpcProvider found on ethers");
}

function isAddress(addr) {
  if (ethers.isAddress) return ethers.isAddress(addr); // v6
  if (ethers.utils && ethers.utils.isAddress) return ethers.utils.isAddress(addr); // v5
  throw new Error("No isAddress helper on ethers");
}

function parseUnits(value, decimals) {
  if (ethers.parseUnits) return ethers.parseUnits(value, decimals); // v6
  if (ethers.utils && ethers.utils.parseUnits) return ethers.utils.parseUnits(value, decimals); // v5
  throw new Error("No parseUnits helper on ethers");
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { address, usdAmount, checkout, paymentTxHash } = body;

    const RPC_URL = process.env.RPC_URL;
    const TOKEN_ADDRESS = process.env.PATRON_TOKEN_ADDRESS;
    const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
    const DECIMALS = Number(process.env.PATRON_DECIMALS || "18");
    const PATRON_PER_USD = Number(process.env.PATRON_PER_USD || "1");

    if (!TOKEN_ADDRESS || !TREASURY_PRIVATE_KEY) {
      console.error("Missing TOKEN_ADDRESS or TREASURY_PRIVATE_KEY env vars");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server misconfigured" }),
      };
    }

    // Basic validation
    if (!address || !isAddress(address)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid address" }),
      };
    }

    const usdNum = Number(usdAmount);
    if (!usdNum || usdNum <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid usdAmount" }),
      };
    }

    if (!PATRON_PER_USD || PATRON_PER_USD <= 0) {
      console.error("Invalid PATRON_PER_USD env value:", PATRON_PER_USD);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server misconfigured" }),
      };
    }

    // 1 USD = PATRON_PER_USD tokens (you’ve set this to 1)
    const patronAmount = usdNum * PATRON_PER_USD;
    const amountWei = parseUnits(String(patronAmount), DECIMALS);

    const provider = getProvider(RPC_URL);
    const signer = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

    // Minimal ABI – we only need transfer() for treasury distribution
    const patronAbi = [
      "function transfer(address to, uint256 amount) public returns (bool)"
    ];

    const patron = new ethers.Contract(TOKEN_ADDRESS, patronAbi, signer);

    const paymentRef =
      paymentTxHash || checkout?.id || checkout?.transactionId || null;

    console.log(
      `Transferring ${patronAmount} PATRON from treasury ${signer.address} to ${address}` +
        (paymentRef ? ` for payment ref ${paymentRef}` : "")
    );

    const tx = await patron.transfer(address, amountWei);
    const receipt = await tx.wait();

    console.log("Transfer tx mined:", receipt.transactionHash);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        to: address,
        usdAmount,
        patronAmount,
        mintedAmountHuman: `${patronAmount} PATRON`,
        fromTreasury: signer.address,
        txHash: receipt.transactionHash,
        paymentRef,
      }),
    };
  } catch (err) {
    console.error("Mint/transfer error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Mint failed" }),
    };
  }
};