// src/App.jsx  (CowboyPolo.com)

import React, { useEffect, useRef, useState } from "react";
import {
  CheckoutWidget,
  ConnectEmbed,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useWalletBalance,
  darkTheme,
} from "thirdweb/react";
import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import "./App.css";

// -----------------------------
// Thirdweb client + chain
// -----------------------------
const client = createThirdwebClient({
  clientId: "f58c0bfc6e6a2c00092cc3c35db1eed8",
});
const BASE = defineChain(8453);

// Embedded email wallets
const wallets = [
  inAppWallet({
    auth: {
      options: ["email"],
    },
  }),
];

// -----------------------------
// Shared Patron Wallet / Checkout theme (same as Patronium / USPPA)
// -----------------------------
const patronCheckoutTheme = darkTheme({
  fontFamily:
    '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
  colors: {
    modalBg: "#050505",
    modalOverlayBg: "rgba(0,0,0,0.85)",
    borderColor: "#3a2b16",
    separatorLine: "#3a2b16",
    mutedBg: "#050505",
    skeletonBg: "#111111",
    primaryText: "#f5eedc",
    secondaryText: "#c7b08a",
    selectedTextColor: "#111111",
    selectedTextBg: "#f5eedc",
    primaryButtonBg: "#e3bf72",
    primaryButtonText: "#181210",
    secondaryButtonBg: "#050505",
    secondaryButtonText: "#f5eedc",
    secondaryButtonHoverBg: "#111111",
    accentButtonBg: "#e3bf72",
    accentButtonText: "#181210",
    connectedButtonBg: "#050505",
    connectedButtonHoverBg: "#111111",
    secondaryIconColor: "#c7b08a",
    secondaryIconHoverColor: "#f5eedc",
    secondaryIconHoverBg: "#111111",
    danger: "#f97373",
    success: "#4ade80",
    tooltipBg: "#050505",
    tooltipText: "#f5eedc",
    inputAutofillBg: "#050505",
    scrollbarBg: "#050505",
  },
});

// -----------------------------
// Simple error boundary for CheckoutWidget
// -----------------------------
class CheckoutBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("CheckoutWidget crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <p style={{ color: "#e3bf72", marginTop: "12px" }}>
          Checkout temporarily unavailable. Please try again later.
        </p>
      );
    }
    return this.props.children;
  }
}

// -----------------------------
// Main App
// -----------------------------
export default function App() {
  const year = 2026;

  // Wallet / modal state
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [usdAmount, setUsdAmount] = useState("1");
  const walletScrollRef = useRef(null);

  // Gate section ref for auto-open wallet when scrolling
  const gateRef = useRef(null);
  const hasTriggeredGateRef = useRef(false);

  // thirdweb account
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const isConnected = !!account;

  // Native ETH on Base (gas)
  const { data: baseBalance } = useWalletBalance({
    address: account?.address,
    chain: BASE,
    client,
  });

  // USDC on Base
  const { data: usdcBalance } = useWalletBalance({
    address: account?.address,
    chain: BASE,
    client,
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  });

  // PATRON on Base
  const { data: patronBalance } = useWalletBalance({
    address: account?.address,
    chain: BASE,
    client,
    tokenAddress: "0xD766a771887fFB6c528434d5710B406313CAe03A", // PATRON
  });

  const openWallet = () => setIsWalletOpen(true);
  const closeWallet = () => setIsWalletOpen(false);

  const shortAddress = account?.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : "";

  const handleCopyAddress = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      alert("Wallet address copied.");
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  const handleSignOut = () => {
    if (!activeWallet || !disconnect) return;
    try {
      disconnect(activeWallet);
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
    }
  };

  // Normalised amount (both number + string forms)
  const normalizedAmountNumber =
    usdAmount && Number(usdAmount) > 0 ? Number(usdAmount) : 1;
  const normalizedAmount = String(normalizedAmountNumber);

  // Checkout success -> call Netlify mint
  const handleCheckoutSuccess = async (result) => {
    try {
      if (!account?.address) return;

      const resp = await fetch("/.netlify/functions/mint-patron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          usdAmount: normalizedAmount,
          paymentTxHash: result?.transactionHash || result?.id || null,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("mint-patron error:", text);
        alert(
          "Payment succeeded, but we could not mint PATRON automatically.\n" +
            "We’ll review your transaction and credit you manually if needed."
        );
        return;
      }

      await resp.json();
      alert(
        "Thank you — your patronage payment was received.\n\n" +
          "PATRON is being credited to your wallet."
      );
    } catch (err) {
      console.error("Error in handleCheckoutSuccess:", err);
      alert(
        "Payment completed, but there was an error minting PATRON.\n" +
          "We’ll review and fix this on our side."
      );
    }
  };

  // Scroll lock while wallet modal is open
  useEffect(() => {
    if (!isWalletOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    requestAnimationFrame(() => {
      if (walletScrollRef.current) walletScrollRef.current.scrollTop = 0;
    });

    return () => {
      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      const y = top ? Math.abs(parseInt(top, 10)) : 0;
      window.scrollTo(0, y);
    };
  }, [isWalletOpen]);

  // Escape closes wallet
  useEffect(() => {
    if (!isWalletOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeWallet();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWalletOpen]);

  // Reset scroll-gate state when connect/disconnect
  useEffect(() => {
    hasTriggeredGateRef.current = false;
  }, [isConnected]);

  // Auto-open wallet once when gate-zone scrolls into view (if NOT connected)
  useEffect(() => {
    if (isConnected) return;

    const onScroll = () => {
      if (hasTriggeredGateRef.current) return;
      const el = gateRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const triggerY = 120;

      if (rect.top <= triggerY && rect.bottom > 0) {
        hasTriggeredGateRef.current = true;
        setIsWalletOpen(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isConnected]);

  return (
    <div className="page">
      {/* Header / hero */}
      <header id="top" className="site-header">
        <div className="header-actions">
          <button className="btn btn-primary" type="button" onClick={openWallet}>
            Patron Wallet
          </button>
        </div>

        <h1 className="masthead-title">
          <span className="masthead-line">Cowboy Polo</span>
          <span className="masthead-line">Circuit</span>
        </h1>

        <p className="est">AMERICAN DEVELOPMENT PIPELINE</p>
      </header>

      {/* Main content */}
      <main className="container">
        <hr className="rule" />

        <h2 className="sc">About</h2>
        <p>
          Cowboy Polo is a pragmatic development path for new American players:
          clinics, sanctioned chukkers, and a high-trust chapter system grounded
          in horsemanship, safety, and repeatable play.
        </p>

        <hr className="rule rule-spaced" />

        {/* -------------------------------------------------------
            GATED ZONE STARTS HERE (blur overlay begins here)
        ------------------------------------------------------- */}
        <div className="gate-zone" id="gate" ref={gateRef}>
          {!isConnected && (
            <div
              className="gate-overlay"
              onClick={openWallet}
              role="button"
              aria-label="Sign in required"
            >
              <div className="gate-card">
                <div className="gate-kicker">Patron Wallet Required</div>
                <div className="gate-title">Sign in to continue</div>
                <div className="gate-copy">
                  This section and everything below is reserved for signed-in
                  patrons. Tap here or scroll into this section to open the
                  Patron Wallet.
                </div>

                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={openWallet}
                  >
                    Open Patron Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gate content */}
          <div aria-hidden={!isConnected && true}>
            <hr className="rule" />
            <h2 className="sc">Join the Circuit</h2>
            <p>
              Use the signup form below to register your interest. This becomes
              a chapter-usable record and links your role to your Patron Wallet.
            </p>

            {/* Netlify signup form */}
            <form
              className="signup-form"
              name="circuit-signup"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="circuit-signup" />

              <p style={{ display: "none" }}>
                <label>
                  Don’t fill this out if you're human:{" "}
                  <input name="bot-field" />
                </label>
              </p>

              <div className="signup-grid">
                <div className="signup-col">
                  <label htmlFor="cs-name">Name</label>
                  <input id="cs-name" name="name" type="text" required />
                </div>

                <div className="signup-col">
                  <label htmlFor="cs-email">Email</label>
                  <input id="cs-email" name="email" type="email" required />
                </div>

                <div className="signup-col">
                  <label htmlFor="cs-phone">Phone</label>
                  <input id="cs-phone" name="phone" type="tel" />
                </div>

                <div className="signup-col">
                  <label htmlFor="cs-role">Role</label>
                  <select id="cs-role" name="role" required>
                    <option value="">Select</option>
                    <option>Player</option>
                    <option>Patron</option>
                    <option>Trainer</option>
                    <option>Stable / Arena</option>
                    <option>Volunteer</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="signup-col signup-col-full">
                  <label htmlFor="cs-location">Location (City/State)</label>
                  <input id="cs-location" name="location" type="text" />
                </div>

                <div className="signup-col signup-col-full">
                  <label htmlFor="cs-interests">
                    Interested in (choose all that apply)
                  </label>
                  <select
                    id="cs-interests"
                    name="interests"
                    multiple
                    style={{ height: 120 }}
                  >
                    <option>Clinics</option>
                    <option>Sanctioned Chukkers</option>
                    <option>Chapter Formation</option>
                    <option>Bring-Your-Own-Horse Play</option>
                    <option>Horse Consignment</option>
                    <option>Founding Patron Support</option>
                    <option>Volunteer / Operations</option>
                  </select>
                </div>

                <div className="signup-col signup-col-full">
                  <label htmlFor="cs-notes">Notes</label>
                  <textarea
                    id="cs-notes"
                    name="notes"
                    rows={3}
                    placeholder="Tell us about your experience, horses, or program."
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #333333",
                      background: "#050505",
                      color: "#f5eedc",
                      fontFamily: '"EB Garamond", serif',
                      fontSize: "0.95rem",
                      resize: "vertical",
                      minHeight: "80px",
                    }}
                  />
                </div>

                {/* Wallet address – visible + hidden copy for Netlify */}
                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="cs-wallet"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Linked Wallet
                  </label>
                  <input
                    id="cs-wallet"
                    type="text"
                    value={account?.address || ""}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #333333",
                      background: "#050505",
                      color: "#f5eedc",
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  />
                  <input
                    type="hidden"
                    name="walletAddress"
                    value={account?.address || ""}
                  />
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      fontSize: "10px",
                      color: "#9f8a64",
                    }}
                  >
                    This links your Circuit interest to your Patron Wallet
                    profile.
                  </small>
                </div>

                <div className="signup-col signup-col-full">
                  <button type="submit" className="btn btn-primary">
                    SUBMIT
                  </button>
                </div>
              </div>
            </form>

            <hr className="rule rule-spaced" />

            <h2 className="sc">Submit Chukker Results</h2>
            <p>
              Match captains or appointed officials submit chukker sheets: score
              per chukker, penalties, substitutions, and team standings across
              the Circuit.
            </p>
            <p>
              In the live system, this is where results will be uploaded and
              confirmed before they touch the leaderboards — and where each
              season’s record can be prepared for on-chain archival inside the
              Patronium ecosystem.
            </p>

            <form
              className="results-form"
              name="chukker-results"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              encType="multipart/form-data"
            >
              <input type="hidden" name="form-name" value="chukker-results" />
              <p style={{ display: "none" }}>
                <label>
                  Don’t fill this out if you're human:
                  <input name="bot-field" />
                </label>
              </p>

              {/* Wallet address – visible + hidden copy for Netlify */}
              <div className="results-form-row-inline">
                <div style={{ flex: 1 }}>
                  <label htmlFor="results-wallet">Wallet Address</label>
                  <input
                    id="results-wallet"
                    type="text"
                    value={account?.address || ""}
                    readOnly
                    style={{ fontFamily: "monospace" }}
                  />
                  <input
                    type="hidden"
                    name="walletAddress"
                    value={account?.address || ""}
                  />
                </div>
              </div>

              <div className="results-form-row-inline">
                <div>
                  <label htmlFor="name">Your Name</label>
                  <input id="name" name="name" type="text" required />
                </div>
                <div>
                  <label htmlFor="role">Role</label>
                  <select id="role" name="role" required>
                    <option>Match Captain</option>
                    <option>Official</option>
                    <option>Chapter Officer</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="results-form-row-inline">
                <div>
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" required />
                </div>
                <div>
                  <label htmlFor="chapter">Chapter / Arena</label>
                  <input id="chapter" name="chapter" type="text" />
                </div>
              </div>

              <div className="results-form-row-inline">
                <div>
                  <label htmlFor="date">Match Date</label>
                  <input id="date" name="date" type="date" required />
                </div>
                <div>
                  <label htmlFor="level">Level</label>
                  <select id="level" name="level">
                    <option>Clinic</option>
                    <option>Practice Chukker</option>
                    <option>Sanctioned Chukker</option>
                    <option>League Match</option>
                    <option>Exhibition</option>
                  </select>
                </div>
              </div>

              <div className="results-form-row">
                <label htmlFor="notes">Notes / Summary</label>
                <textarea id="notes" name="notes" rows={4} />
              </div>

              <div className="results-form-row">
                <label htmlFor="sheet">Upload Chukker Sheet (PDF / Image)</label>
                <input id="sheet" name="sheet" type="file" accept=".pdf,image/*" />
              </div>

              <button type="submit" className="btn btn-outline">
                SUBMIT CHUKKER RESULTS
              </button>
            </form>

            <hr className="rule rule-spaced" />

            <h2 className="sc">Patronium</h2>
            <p>
              Patronium (PATRON) is the patronage utility token built on Base.
              Purchase below and your payment will trigger automatic minting via
              the Netlify function.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#c7b08a",
                  marginBottom: 6,
                }}
              >
                Choose Your Patronage (USD)
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #3a2b16",
                  background: "#050505",
                  color: "#f5eedc",
                  fontSize: 16,
                  outline: "none",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
                }}
              />
            </div>

            <CheckoutBoundary>
              <CheckoutWidget
                client={client}
                name={"POLO PATRONIUM"}
                description={
                  "USPPA PATRONAGE UTILITY TOKEN · THREE SEVENS 7̶7̶7̶ REMUDA · COWBOY POLO CIRCUIT · CHARLESTON POLO"
                }
                currency={"USD"}
                chain={BASE}
                amount={normalizedAmountNumber}
                tokenAddress={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"} // USDC
                seller={"0xfee3c75691e8c10ed4246b10635b19bfff06ce16"}
                buttonLabel={"BUY PATRON (USDC on Base)"}
                theme={patronCheckoutTheme}
                onSuccess={handleCheckoutSuccess}
                onError={(err) => {
                  console.error("Checkout error:", err);
                  alert(err?.message || String(err));
                }}
              />
            </CheckoutBoundary>

            <footer style={{ marginTop: 26, textAlign: "center" }}>
              <a href="https://polopatronium.com" target="_blank" rel="noreferrer">
                PoloPatronium.com
              </a>
            </footer>
          </div>
        </div>

        <footer className="site-footer">
          <p className="fineprint">© {year} CowboyPolo.com</p>
        </footer>
      </main>

      {/* Patron Wallet modal */}
      {isWalletOpen && (
        <div
          className="wallet-backdrop"
          onClick={closeWallet}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.86)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "14px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div
              ref={walletScrollRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #3a2b16",
                borderRadius: 14,
                padding: "16px",
                paddingTop: "26px",
                background: "#050505",
                boxShadow: "0 18px 60px rgba(0,0,0,0.85)",
                fontFamily:
                  '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
                color: "#f5eedc",
                fontSize: 13,
                position: "relative",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  position: "relative",
                  paddingTop: 4,
                  textAlign: "center",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "#9f8a64",
                  }}
                >
                  U&nbsp;S&nbsp;P&nbsp;P&nbsp;A
                </div>
                <div
                  style={{
                    fontSize: 16,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c7b08a",
                    lineHeight: 1.1,
                  }}
                >
                  Patron Wallet
                </div>

                <button
                  onClick={closeWallet}
                  aria-label="Close wallet"
                  title="Close"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 56,
                    height: 56,
                    border: "none",
                    background: "transparent",
                    color: "#e3bf72",
                    fontSize: 38,
                    lineHeight: 1,
                    cursor: "pointer",
                    padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  ×
                </button>
              </div>

              <p
                style={{
                  fontSize: 13,
                  textAlign: "center",
                  marginBottom: 14,
                  color: "#f5eedc",
                  fontFamily: '"EB Garamond", serif',
                }}
              >
                Sign in or create your Patron Wallet using email. This is the
                same wallet used on Polo Patronium and USPPA.
              </p>

              {/* Connect / Account */}
              {!account ? (
                <div style={{ marginBottom: 14 }}>
                  <ConnectEmbed
                    client={client}
                    wallets={wallets}
                    chain={BASE}
                    theme={patronCheckoutTheme}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 14, textAlign: "center" }}>
                  {/* Address + copy */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      marginTop: 2,
                    }}
                  >
                    <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                      {shortAddress}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#e3bf72",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      aria-label="Copy wallet address"
                    >
                      📋
                    </button>
                  </div>

                  {/* Gas + USDC */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 28,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#9f8a64",
                          marginBottom: 2,
                        }}
                      >
                        Gas
                      </div>
                      <div style={{ color: "#f5eedc", fontSize: 13 }}>
                        {baseBalance?.displayValue || "0"}{" "}
                        {baseBalance?.symbol || "ETH"}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#9f8a64",
                          marginBottom: 2,
                        }}
                      >
                        USDC
                      </div>
                      <div style={{ color: "#f5eedc", fontSize: 13 }}>
                        {usdcBalance?.displayValue || "0"}{" "}
                        {usdcBalance?.symbol || "USDC"}
                      </div>
                    </div>
                  </div>

                  {/* Patron balance */}
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#c7b08a",
                        marginBottom: 4,
                      }}
                    >
                      Patronium Balance
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        letterSpacing: "0.02em",
                        color: "#f5eedc",
                      }}
                    >
                      {patronBalance?.displayValue || "0"}{" "}
                      {patronBalance?.symbol || "PATRON"}
                    </div>
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{
                      minWidth: "auto",
                      padding: "6px 18px",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}

              <div style={{ marginTop: 8, textAlign: "center" }}>
                <button className="btn btn-primary" type="button" onClick={closeWallet}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}