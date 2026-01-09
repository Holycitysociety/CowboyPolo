// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";

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

// ---------------------------------------------
// Thirdweb client + chain (same as Patronium)
// ---------------------------------------------
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

// Theme to match Patron wallet look
const cowboyWalletTheme = darkTheme({
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

// ---------------------------------------------
// Simple error boundary for CheckoutWidget
// ---------------------------------------------
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
        <p style={{ color: "#e3bf72", marginTop: "12px", textAlign: "center" }}>
          Checkout temporarily unavailable. Please try again later.
        </p>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------
// Gate overlay (nice reminder card)
// ---------------------------------------------
function GateOverlay({
  title = "PATRON WALLET REQUIRED",
  headline = "SIGN IN TO\nCONTINUE",
  body = "This section and everything below is reserved for signed-in patrons. Tap here or scroll into this section to open the USPPA Patron Wallet.",
  cta = "OPEN PATRON WALLET",
  onClick,
}) {
  return (
    <div className="gate-overlay" onClick={onClick} role="button" aria-label={title}>
      <div className="gate-card">
        <div className="gate-kicker">{title}</div>
        <div className="gate-title">
          {headline.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="gate-copy">{body}</div>
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-outline btn-gate">
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Main App
// ---------------------------------------------
export default function App() {
  const year = new Date().getFullYear();

  // Wallet / modal state
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const walletScrollRef = useRef(null);

  // Checkout amount
  const [usdAmount, setUsdAmount] = useState("1");

  // Scroll-gating state
  const [hasTriggeredGate, setHasTriggeredGate] = useState(false);
  const roadmapGateRef = useRef(null);

  // Thirdweb hooks
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const isConnected = !!account;

  // Balances
  const { data: baseBalance } = useWalletBalance({
    address: account?.address,
    chain: BASE,
    client,
  });

  const { data: usdcBalance } = useWalletBalance({
    address: account?.address,
    chain: BASE,
    client,
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  });

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

  // ✅ CheckoutWidget amount expects a NUMBER
  const normalizedAmountNumber =
    usdAmount && Number(usdAmount) > 0 ? Number(usdAmount) : 1;

  const handleCheckoutSuccess = async (result) => {
    try {
      if (!account?.address) return;

      const resp = await fetch("/.netlify/functions/mint-patron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          usdAmount: String(normalizedAmountNumber),
          checkout: {
            id: result?.id,
            amountPaid: result?.amountPaid ?? String(normalizedAmountNumber),
            currency: result?.currency ?? "USD",
          },
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

  // Lock body scroll when modal open
  useEffect(() => {
    if (isWalletOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        if (walletScrollRef.current) walletScrollRef.current.scrollTop = 0;
      });

      return () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      };
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, [isWalletOpen]);

  // ESC closes modal
  useEffect(() => {
    if (!isWalletOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeWallet();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWalletOpen]);

  // Scroll gating: when ABOUT section bottom crosses near top, open wallet once
  useEffect(() => {
    if (isConnected) {
      setHasTriggeredGate(false);
      return;
    }

    const handleScroll = () => {
      if (hasTriggeredGate) return;
      const el = roadmapGateRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const triggerY = 96; // px from top of viewport

      if (rect.bottom <= triggerY) {
        setHasTriggeredGate(true);
        setIsWalletOpen(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isConnected, hasTriggeredGate]);

  return (
    <div className="page">
      {/* Top header with centered Patron Wallet button */}
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 0 0",
          marginBottom: "8px",
        }}
      >
        <button
          className="btn btn-outline"
          style={{ minWidth: "auto", padding: "6px 20px" }}
          onClick={openWallet}
        >
          PATRON WALLET
        </button>
      </header>

      {/* HERO POSTER */}
      <section className="hero">
        <div className="hero-topline">
          UNITED STATES POLO
          <br />
          PATRONS ASSOCIATION
        </div>
        <div className="hero-rule" />
        <div className="hero-presents">PRESENTS THE</div>

        <div className="hero-main">
          <span className="hero-word cowboy">COWBOY</span>
          <span className="hero-word polo">POLO</span>
          <span className="hero-word circuit">CIRCUIT</span>
        </div>

        <div className="hero-tagline">
          A NATIONAL DEVELOPMENT LEAGUE FOR PLAYERS, PONIES &amp; PATRONS
        </div>

        <div className="hero-rule-2" />

        {/* Streaming on THE POLO WAY first */}
        <div className="hero-badges" style={{ marginTop: "0" }}>
          <div className="hero-badge-intro">STREAMING ON</div>
          <div
            style={{
              fontFamily: '"IM Fell English SC", serif',
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontSize: "0.95rem",
            }}
          >
            THE POLO WAY
          </div>
        </div>

        {/* Divider between Polo Way and Remuda */}
        <div
          className="hero-rule-2"
          style={{ marginTop: "18px", marginBottom: "18px" }}
        />

        {/* Then Introducing THREE SEVENS REMUDA */}
        <div className="hero-badges">
          <div className="hero-badge-intro">INTRODUCING</div>
          <div className="three-sevens-mark">
            <div className="three-sevens-numeral">7̶7̶7̶</div>
            <div className="three-sevens-text">THREE SEVENS REMUDA</div>
          </div>
        </div>

        <div className="hero-cta-row">
          <button className="btn btn-primary" onClick={openWallet}>
            Sign up / Sign in
          </button>
        </div>
      </section>

      {/* WALLET MODAL */}
      {isWalletOpen && (
        <div
          className="wallet-modal-backdrop"
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
          <div style={{ width: "100%", maxWidth: "380px" }}>
            <div
              ref={walletScrollRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #3a2b16",
                borderRadius: "14px",
                padding: "16px",
                paddingTop: "26px",
                background: "#050505",
                boxShadow: "0 18px 60px rgba(0,0,0,0.85)",
                fontFamily:
                  '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
                color: "#f5eedc",
                fontSize: "13px",
                position: "relative",
              }}
            >
              {/* Modal header (3-line title like USPPA site) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                  position: "relative",
                  paddingTop: "4px",
                  textAlign: "center",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "#9f8a64",
                    lineHeight: 1.1,
                  }}
                >
                  U&nbsp;S&nbsp;P&nbsp;P&nbsp;A
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c7b08a",
                    lineHeight: 1.1,
                  }}
                >
                  Cowboy Polo Circuit
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#f5eedc",
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
                    width: "56px",
                    height: "56px",
                    border: "none",
                    background: "transparent",
                    color: "#e3bf72",
                    fontSize: "38px",
                    lineHeight: 1,
                    cursor: "pointer",
                    padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Explanatory copy under title */}
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  textAlign: "center",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#dec89a",
                }}
              >
                Sign up with your email to create your Cowboy Polo Patron
                Wallet. After you sign in, you&apos;ll receive an email with the
                Cowboy Polo Circuit signup details.
              </p>

              {/* Connect or account view */}
              {!account ? (
                <div style={{ marginBottom: "14px" }}>
                  <ConnectEmbed
                    client={client}
                    wallets={wallets}
                    chain={BASE}
                    theme={cowboyWalletTheme}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: "14px", textAlign: "center" }}>
                  {/* Address + copy */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: "10px",
                      marginTop: "2px",
                    }}
                  >
                    <div style={{ fontFamily: "monospace", fontSize: "13px" }}>
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
                        fontSize: "14px",
                      }}
                      aria-label="Copy wallet address"
                    >
                      📋
                    </button>
                  </div>

                  {/* Balances */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "28px",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#9f8a64",
                          marginBottom: "2px",
                        }}
                      >
                        Gas
                      </div>
                      <div style={{ color: "#f5eedc", fontSize: "13px" }}>
                        {baseBalance?.displayValue || "0"}{" "}
                        {baseBalance?.symbol || "ETH"}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#9f8a64",
                          marginBottom: "2px",
                        }}
                      >
                        USDC
                      </div>
                      <div style={{ color: "#f5eedc", fontSize: "13px" }}>
                        {usdcBalance?.displayValue || "0"}{" "}
                        {usdcBalance?.symbol || "USDC"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#c7b08a",
                        marginBottom: "4px",
                      }}
                    >
                      Patronium Balance
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
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
                      fontSize: "11px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Amount + Checkout (like Patronium site) */}
              <div className="wallet-checkout-zone" style={{ position: "relative" }}>
                {!isConnected && (
                  <button
                    type="button"
                    onClick={() => {}}
                    aria-label="Connect required"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.55)",
                      zIndex: 10,
                      borderRadius: "12px",
                      border: "none",
                      padding: 0,
                      cursor: "default",
                    }}
                  />
                )}

                <div
                  style={{
                    opacity: !isConnected ? 0.75 : 1,
                    pointerEvents: isConnected ? "auto" : "none",
                    transition: "opacity 160ms ease",
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#c7b08a",
                        marginBottom: "6px",
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
                        borderRadius: "10px",
                        border: "1px solid #3a2b16",
                        background: "#050505",
                        color: "#f5eedc",
                        fontSize: "16px",
                        outline: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
                      }}
                    />
                  </div>

                  <CheckoutBoundary>
                    <CheckoutWidget
                      client={client}
                      name={"COWBOY POLO CIRCUIT"}
                      description={
                        "USPPA · COWBOY POLO CIRCUIT · THREE SEVENS 7̶7̶7̶ REMUDA · THE POLO WAY"
                      }
                      currency={"USD"}
                      chain={BASE}
                      amount={normalizedAmountNumber}
                      tokenAddress={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"} // USDC
                      seller={"0xfee3c75691e8c10ed4246b10635b19bfff06ce16"}
                      buttonLabel={"BUY PATRON (USDC on Base)"}
                      theme={cowboyWalletTheme}
                      onSuccess={handleCheckoutSuccess}
                      onError={(err) => {
                        console.error("Checkout error:", err);
                        alert(err?.message || String(err));
                      }}
                    />
                  </CheckoutBoundary>
                </div>
              </div>

              {/* Small note */}
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "11px",
                  lineHeight: 1.5,
                  color: "#c7b08a",
                  textAlign: "center",
                }}
              >
                This Patron Wallet works across the Cowboy Polo Circuit and the
                Polo Patronium site on Base.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT / HOW IT FUNCTIONS (scroll gate attaches here) */}
      <section id="about" ref={roadmapGateRef}>
        <div className="section-header">
          <div className="section-kicker">THE FORMAT</div>
          <h2 className="section-title">HOW THE COWBOY POLO CIRCUIT WORKS</h2>
          <div className="section-rule" />
        </div>

        <div className="section-body">
          <p>
            The Cowboy Polo Circuit is a national development league for
            players, ponies, &amp; patrons built on sanctioned Cowboy Polo
            chukkers.
          </p>
          <p>
            Games are played 3 on 3 in arenas or campitos. The key is that a
            player does not need a full string to attract patrons: a rider can
            progress by playing as little as one chukker, on one good horse,
            and still build a real Circuit handicap.
          </p>
          <p>
            Cowboy Polo chukkers can be hosted by any stable, arena, or program
            that signs on to the Circuit. A local coach, instructor, or
            appointed captains run the game, then submit the chukker sheet
            feeding two tables: the individual handicap table for each rider,
            and the game results table for teams.
          </p>
          <p>
            Each sanctioned chukker updates both sides of the story: how riders
            are rated, and how their teams are performing.
          </p>
          <p>
            Over the course of a Circuit season, those two tables are the
            backbone of the standings: player handicaps and team records (wins,
            losses, goal difference) together define how the season is read.
          </p>
          <p>
            Local chapters also feed into{" "}
            <span style={{ fontStyle: "italic" }}>The Polo Way</span>: riders
            and arenas can submit 360° VR footage from sanctioned Cowboy Polo
            chukkers to thepoloway.com so patrons can follow and support the
            Circuit from anywhere.
          </p>
        </div>
      </section>

      {/* PLAYER LEADERBOARD (GATED) */}
      <section id="players" className="gate-zone">
        <div className="section-header">
          <div className="section-kicker">PLAYER STANDINGS</div>
          <h2 className="section-title">RIDER HANDICAP LEADERBOARD</h2>
          <div className="section-rule" />
        </div>

        {!isConnected && (
          <GateOverlay
            title="PATRON WALLET REQUIRED"
            headline={"SIGN IN TO\nCONTINUE"}
            body="This section and everything below is reserved for signed-in patrons. Tap here or scroll into this section to open the USPPA Patron Wallet."
            cta="OPEN PATRON WALLET"
            onClick={openWallet}
          />
        )}

        <div aria-hidden={!isConnected && true}>
          <div className="section-body" style={{ marginTop: "20px" }}>
            <p>
              Player handicaps in the Cowboy Polo Circuit are not just static
              numbers. Each rider’s Cowboy Polo handicap is a statistically
              calculated, ELO-style rating, updated after every sanctioned
              chukker and displayed to two decimal places.
            </p>
            <p>
              Ratings move with performance over time: goals scored, assists,
              ride-offs won, and overall impact on the match all feed the same
              underlying score. The table below shows how a leaderboard might
              appear during mid-season.
            </p>
          </div>

          <div className="board">
            <div className="board-title">Top Riders — Mid-Season Snapshot</div>
            <div className="board-sub">
              Handicaps update as sanctioned results are submitted.
            </div>

            <div className="board-header">
              <span>Rider</span>
              <span>Chapter</span>
              <span>Handicap</span>
            </div>
            <div className="board-row">
              <span>Ryder Mitchell</span>
              <span>Charleston</span>
              <span className="handicap-value">
                <span className="handicap-value-main">2</span>
                <span className="handicap-value-decimal">.15</span>
              </span>
            </div>
            <div className="board-row">
              <span>Casey Navarro</span>
              <span>Three Sevens 7̶7̶7̶</span>
              <span className="handicap-value">
                <span className="handicap-value-main">1</span>
                <span className="handicap-value-decimal">.40</span>
              </span>
            </div>
            <div className="board-row">
              <span>Jess Carter</span>
              <span>Independent</span>
              <span className="handicap-value">
                <span className="handicap-value-main">1</span>
                <span className="handicap-value-decimal">.25</span>
              </span>
            </div>
            <div className="board-row">
              <span>Lane Douglas</span>
              <span>Charleston</span>
              <span className="handicap-value">
                <span className="handicap-value-main">0</span>
                <span className="handicap-value-decimal">.85</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HORSE & REMUDA SECTION (GATED) */}
      <section id="horses" className="gate-zone">
        <div className="section-header">
          <div className="section-kicker">
            <div className="three-sevens-mark">
              <div className="three-sevens-numeral">7̶7̶7̶</div>
              <div className="three-sevens-text">THREE SEVENS REMUDA</div>
            </div>
          </div>
          <h2 className="section-title">HORSE PERFORMANCE &amp; REMUDA</h2>
          <div className="section-rule" />
        </div>

        {!isConnected && (
          <GateOverlay
            title="PATRON WALLET REQUIRED"
            headline={"SIGN IN TO\nCONTINUE"}
            body="This section and everything below is reserved for signed-in patrons. Tap here or scroll into this section to open the USPPA Patron Wallet."
            cta="OPEN PATRON WALLET"
            onClick={openWallet}
          />
        )}

        <div aria-hidden={!isConnected && true}>
          <div className="section-body" style={{ marginTop: "20px" }}>
            <p>
              The Three Sevens 7̶7̶7̶ Remuda is the managed string of USPPA
              horses — tracked from their first Cowboy Polo chukker through
              their entire competitive career.
            </p>
            <p>
              Every sanctioned appearance adds to a horse’s trace: chukkers
              played, riders carried, contribution to wins, and awards earned
              across chapters and seasons. The same horse might be bred in one
              place, started by another, developed by a pro, and later carry
              juniors and patrons.
            </p>
            <p>
              By keeping a single, living record for each Remuda horse,
              breeders, trainers, players, and patrons can all see the full
              life of an equine athlete — not just a single sale moment.
            </p>
            <p>
              Over time, those records can be linked into the Patronium
              ecosystem so that the people who helped bring a horse along its
              path can participate in its economic story, not only its final
              ownership.
            </p>
          </div>

          <div className="board">
            <div className="board-title">Remuda Horses — Performance Snapshot</div>
            <div className="board-sub">
              Score blends chukker count, match impact, and rider feedback
              across the season.
            </div>

            <div className="board-header">
              <span>Horse</span>
              <span>String</span>
              <span>Score</span>
            </div>
            <div className="board-row">
              <span>Thunderbird</span>
              <span>7̶7̶7̶</span>
              <span>92</span>
            </div>
            <div className="board-row">
              <span>Sundance</span>
              <span>7̶7̶7̶</span>
              <span>88</span>
            </div>
            <div className="board-row">
              <span>Cholla</span>
              <span>Private</span>
              <span>81</span>
            </div>
            <div className="board-row">
              <span>River Scout</span>
              <span>7̶7̶7̶</span>
              <span>79</span>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS / NETLIFY FORM (GATED) */}
      <section id="results" className="gate-zone">
        <div className="section-header">
          <div className="section-kicker">RESULTS &amp; RECORD</div>
          <h2 className="section-title">
            SANCTIONED CHUKKERS &amp; SEASON RECORD
          </h2>
          <div className="section-rule" />
        </div>

        {!isConnected && (
          <GateOverlay
            title="PATRON WALLET REQUIRED"
            headline={"SIGN IN TO\nCONTINUE"}
            body="This section and everything below is reserved for signed-in patrons. Tap here or scroll into this section to open the USPPA Patron Wallet."
            cta="OPEN PATRON WALLET"
            onClick={openWallet}
          />
        )}

        <div aria-hidden={!isConnected && true}>
          <div className="section-body" style={{ marginTop: "20px" }}>
            <p>
              Match captains or appointed officials submit chukker sheets:
              teams, scorelines, rider combinations, and notable horse usage.
              Those sheets become the official record that updates handicaps
              and team standings across the Circuit.
            </p>
            <p>
              In the live system, this is where results will be uploaded and
              confirmed before they touch the leaderboards — and where each
              season’s record can be prepared for on-chain archival inside the
              Patronium ecosystem.
            </p>
          </div>

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

            <div className="results-form-row-inline">
              <div>
                <label htmlFor="name">Your Name</label>
                <input id="name" name="name" type="text" required />
              </div>
              <div>
                <label htmlFor="role">Role</label>
                <select id="role" name="role" required>
                  <option value=">Select role">Select role</option>
                  <option>Coach / Instructor</option>
                  <option>Team Captain</option>
                  <option>Arena Steward</option>
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
                <label htmlFor="match-date">Match Date</label>
                <input id="match-date" name="match-date" type="date" />
              </div>
              <div>
                <label htmlFor="location">Location</label>
                <input id="location" name="location" type="text" />
              </div>
            </div>

            <div>
              <label htmlFor="details">Chukker Details</label>
              <textarea
                id="details"
                name="details"
                rows={4}
                placeholder="Teams, riders, horses, scoreline, and any notes."
              />
            </div>

            <div>
              <label htmlFor="file">Upload Chukker Sheet (optional)</label>
              <input id="file" name="file" type="file" />
              <small>PDF, image, or spreadsheet files are welcome.</small>
            </div>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button type="submit" className="btn btn-outline">
                SUBMIT CHUKKER RESULTS
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer>
        © <span>{year}</span> UNITED STATES POLO PATRONS ASSOCIATION · COWBOY
        POLO CIRCUIT
      </footer>
    </div>
  );
}