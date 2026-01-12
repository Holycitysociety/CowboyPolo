// src/App.jsx  (COWBOYPOLO.com)
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  ConnectEmbed,
  CheckoutWidget,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useWalletBalance,
  darkTheme,
} from "thirdweb/react";
import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";

// ---------------------------------------------
// Thirdweb client + chain (same as Patronium / USPPA)
// ---------------------------------------------
const client = createThirdwebClient({
  clientId: "f58c0bfc6e6a2c00092cc3c35db1eed8",
});
const BASE = defineChain(8453);

// Embedded email wallets
const wallets = [
  inAppWallet({
    auth: { options: ["email"] },
  }),
];

// ---------------------------------------------
// Shared Patron Wallet / Checkout theme
// (same spec as USPOLOPATRONS & PoloPatronium)
// ---------------------------------------------
const patronCheckoutTheme = darkTheme({
  fontFamily:
    '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
  // Make thirdweb buttons (including BUY PATRON) pill-shaped
  borderRadius: 999,
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
        <p style={{ color: "#e3bf72", marginTop: "12px" }}>
          Checkout temporarily unavailable. Please try again later.
        </p>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------
// Zoom-on-scroll full-bleed photo band
// ---------------------------------------------
function ParallaxBand({
  src,
  children,
  first = false,
  zoom = 30,
  speed = 0.1,
  finishFactor = 2,
}) {
  const bandRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      if (!bandRef.current || !imgRef.current) return;

      const rect = bandRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = vh + rect.height;

      let raw = (vh - rect.top) / total;
      raw *= finishFactor;

      const progress = Math.min(1, Math.max(0, raw));
      const eased = Math.pow(progress, speed);

      const minZoom = 1;
      const maxZoom = zoom;
      const currentZoom = maxZoom - (maxZoom - minZoom) * eased;

      imgRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${currentZoom})`;
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [zoom, speed, finishFactor]);

  return (
    <div
      ref={bandRef}
      className={`parallax-band full-bleed ${first ? "parallax-band-first" : ""}`}
    >
      <div className="parallax-media" aria-hidden="true">
        <img ref={imgRef} className="parallax-img" src={src} alt="" />
        <div className="parallax-vignette" />
      </div>
      <div className="parallax-content">{children}</div>
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
  const [usdAmount, setUsdAmount] = useState("1");
  const walletScrollRef = useRef(null);

  // Circuit signup modal
  const [isCircuitModalOpen, setIsCircuitModalOpen] = useState(false);

  // Scroll-gating state (wallet popup when roadmap passes)
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

  const openCircuitSignup = () => {
    if (!isConnected) return;
    setIsWalletOpen(false);
    setIsCircuitModalOpen(true);
  };

  const closeCircuitSignup = () => {
    setIsCircuitModalOpen(false);
  };

  // ✅ CheckoutWidget amount expects a NUMBER (not a string)
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

  // Lock background scroll when wallet modal open
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

  // Escape closes wallet modal
  useEffect(() => {
    if (!isWalletOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeWallet();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWalletOpen]);

  // Scroll trigger: when bottom of roadmap approaches top, pop wallet (once)
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
      {/* Top-right Patron Wallet button */}
      <header
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "8px 0",
        }}
      >
        <button
          className="btn btn-outline"
          style={{ minWidth: "auto", padding: "8px 12px" }}
          onClick={openWallet}
        >
          {isConnected ? `Patron Wallet: ${shortAddress}` : "Open Patron Wallet"}
        </button>
      </header>

      {/* HERO */}
      <main>
        <ParallaxBand src="/images/cowboy-1.jpeg" first zoom={30} speed={0.1} finishFactor={2}>
          <div className="hero">
            <div className="hero-kicker">COWBOY POLO CIRCUIT</div>
            <h1 className="hero-title">THE AMERICAN POLO PIPELINE</h1>
            <p className="hero-subtitle">
              A low-barrier, arena-first format to form riders, horses, and
              chapters — tracked in a live handicap table and patron-backed by
              Patronium.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={openWallet}>
                Get Patron Wallet
              </button>
              <a className="btn btn-outline" href="#roadmap">
                How It Works
              </a>
            </div>
          </div>
        </ParallaxBand>

        {/* ROADMAP / GATE REF */}
        <section id="roadmap" ref={roadmapGateRef} className="band-section">
          <div className="section-header">
            <div className="section-kicker">CIRCUIT MODEL</div>
            <h2 className="section-title">FROM FIRST CHUKKER TO REAL STANDINGS</h2>
            <div className="section-rule" />
          </div>

          <div className="section-body">
            <p>
              Cowboy Polo is designed to scale in arenas and campitos — 3 on 3,
              fast, teachable, and trackable. The Circuit builds a public
              handicap table for riders and a season record for teams.
            </p>

            <p>
              Every sanctioned chukker is submitted by local captains and becomes
              part of the official record. Those records become the spine of
              a season: players and teams.
            </p>

            <p>
              Local chapters also feed into{" "}
              <span style={{ fontStyle: "italic" }}>The Polo Way</span>: riders
              and arenas submit 360° VR footage from sanctioned Cowboy Polo
              chukkers to thepoloway.com so patrons can follow and support the
              Circuit from anywhere.
            </p>
          </div>
        </section>

        {/* PHOTO BAND 2 */}
        <ParallaxBand src="/images/cowboy-2.jpeg" zoom={30} speed={0.1} finishFactor={2} />

        {/* PLAYER LEADERBOARD (GATED) */}
        <section
          id="players"
          className="band-section"
          style={{ marginTop: "-20px", paddingTop: "20px" }}
        >
          <div className="section-header">
            <div className="section-kicker">PLAYER STANDINGS</div>
            <h2 className="section-title">RIDER HANDICAP LEADERBOARD</h2>
            <div className="section-rule" />
          </div>

          <div style={{ position: "relative", marginTop: "20px" }}>
            {!isConnected && (
              <div
                onClick={openWallet}
                aria-label="Sign in required to view rider standings"
                role="button"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 50,
                  background: "rgba(0, 0, 0, 1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "22px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      marginBottom: "8px",
                    }}
                  >
                    COWBOY POLO CIRCUIT STANDINGS
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#f5eedc" }}>
                    Sign into your Patron Wallet to view live rider handicaps and
                    Circuit tables.
                  </div>
                </div>
              </div>
            )}

            <div aria-hidden={!isConnected && true}>
              <div className="section-body">
                <p>
                  Player handicaps in the Cowboy Polo Circuit are not just static
                  numbers. Each rider’s Cowboy Polo handicap is a statistically
                  calculated, ELO-style rating, updated after every sanctioned
                  chukker and displayed to two decimal places.
                </p>
              </div>

              {/* Placeholder table for MVP (your live data will replace this) */}
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Rider</th>
                      <th>Handicap</th>
                      <th>Chapter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>—</td>
                      <td>Coming Soon</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* PHOTO BAND 3 */}
        <ParallaxBand src="/images/cowboy-3.jpeg" zoom={30} speed={0.1} finishFactor={2} />

        {/* TEAMS (GATED) */}
        <section id="teams" className="band-section">
          <div className="section-header">
            <div className="section-kicker">TEAM STANDINGS</div>
            <h2 className="section-title">SEASON RECORD TABLE</h2>
            <div className="section-rule" />
          </div>

          <div style={{ position: "relative", marginTop: "20px" }}>
            {!isConnected && (
              <div
                onClick={openWallet}
                aria-label="Sign in required to view team standings"
                role="button"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 50,
                  background: "rgba(0, 0, 0, 1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "22px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      marginBottom: "8px",
                    }}
                  >
                    CIRCUIT TABLES
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#f5eedc" }}>
                    Sign into your Patron Wallet to view live season records.
                  </div>
                </div>
              </div>
            )}

            <div aria-hidden={!isConnected && true}>
              <div className="section-body">
                <p>
                  Team records track chapter-level performance across the season.
                  This table will be populated from sanctioned chukker submissions.
                </p>
              </div>

              {/* Placeholder table for MVP */}
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>W</th>
                      <th>L</th>
                      <th>GF</th>
                      <th>GA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* JOIN CTA */}
        <section id="join" className="band-section">
          <div className="section-header">
            <div className="section-kicker">JOIN</div>
            <h2 className="section-title">BECOME A RIDER, PARENT, OR ARENA PARTNER</h2>
            <div className="section-rule" />
          </div>

          <div className="section-body">
            <p>
              Create your Patron Wallet, then join the Circuit. Your signup links
              your interest to your wallet so chapters and rewards can be
              coordinated.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <button
              className="btn btn-primary"
              onClick={openCircuitSignup}
              disabled={!isConnected}
              style={{
                opacity: isConnected ? 1 : 0.6,
                cursor: isConnected ? "pointer" : "not-allowed",
              }}
            >
              Join the Cowboy Polo Circuit
            </button>

            {!isConnected && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "10px",
                  lineHeight: 1.4,
                  color: "#9f8a64",
                  textAlign: "center",
                }}
              >
                Connect or create your Patron Wallet above to enable this step.
              </div>
            )}
          </div>
        </section>

        {/* RESULTS / NETLIFY FORM (GATED) */}
        <section id="results">
          <div className="section-header">
            <div className="section-kicker">RESULTS &amp; RECORD</div>
            <h2 className="section-title">SANCTIONED CHUKKERS &amp; SEASON RECORD</h2>
            <div className="section-rule" />
          </div>

          <div style={{ position: "relative", marginTop: "20px" }}>
            {!isConnected && (
              <div
                onClick={openWallet}
                aria-label="Sign in required to submit or view results"
                role="button"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 50,
                  background: "rgba(0, 0, 0, 1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "22px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      marginBottom: "8px",
                    }}
                  >
                    CIRCUIT RESULTS
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#f5eedc" }}>
                    Sign into your Patron Wallet to submit official chukker results and
                    season records.
                  </div>
                </div>
              </div>
            )}

            <div aria-hidden={!isConnected && true}>
              <div className="section-body">
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

                {/* ✅ Wallet address capture (Netlify) */}
                <input
                  type="hidden"
                  name="walletAddress"
                  value={account?.address || ""}
                />

                <p style={{ display: "none" }}>
                  <label>
                    Don’t fill this out if you're human: <input name="bot-field" />
                  </label>
                </p>

                {/* Optional: show wallet visibly in the results form too */}
                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="results-wallet"
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
                    id="results-wallet"
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
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      fontSize: "10px",
                      color: "#9f8a64",
                    }}
                  >
                    This links the submission to your Patron Wallet.
                  </small>
                </div>

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
          </div>
        </section>
      </main>

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
            zIndex: 10000,
            padding: "14px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "520px" }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxHeight: "90vh",
                overflow: "hidden",
                border: "1px solid #3a2b16",
                borderRadius: "14px",
                background: "#050505",
                boxShadow: "0 18px 60px rgba(0,0,0,0.9)",
                fontFamily:
                  '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
                color: "#f5eedc",
                fontSize: "13px",
                position: "relative",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #3a2b16",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{ textAlign: "center", lineHeight: 1.1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: "U&nbsp;S&nbsp;P&nbsp;P&nbsp;A",
                    }}
                  />
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "14px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#f5eedc",
                    }}
                  >
                    Polo Patronium
                  </div>
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#e3bf72",
                    }}
                  >
                    Patron Wallet
                  </div>
                </div>

                <button
                  onClick={closeWallet}
                  aria-label="Close Patron Wallet"
                  title="Close"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "44px",
                    height: "44px",
                    border: "none",
                    background: "transparent",
                    color: "#e3bf72",
                    fontSize: "30px",
                    lineHeight: 1,
                    cursor: "pointer",
                    padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                ref={walletScrollRef}
                style={{
                  overflowY: "auto",
                  maxHeight: "calc(90vh - 60px)",
                  padding: "14px 16px 16px",
                }}
              >
                {/* Connect / Wallet view */}
                {!isConnected ? (
                  <div>
                    <p style={{ marginTop: 0, color: "#c7b08a", lineHeight: 1.6 }}>
                      Sign in with email to create your Patron Wallet. This wallet is
                      used across Cowboy Polo, USPoloPatrons, and PoloPatronium.
                    </p>

                    <ConnectEmbed
                      client={client}
                      chain={BASE}
                      wallets={wallets}
                      theme={patronCheckoutTheme}
                    />
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "#c7b08a",
                            marginBottom: "6px",
                          }}
                        >
                          Wallet Address
                        </div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: "14px",
                            color: "#f5eedc",
                          }}
                        >
                          {shortAddress}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-outline" onClick={handleCopyAddress}>
                          Copy
                        </button>
                        <button className="btn btn-outline" onClick={handleSignOut}>
                          Sign Out
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid #3a2b16",
                        borderRadius: 12,
                        padding: "10px 12px",
                        marginBottom: "12px",
                        background: "#050505",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#c7b08a",
                        }}
                      >
                        <span>Base ETH (Gas)</span>
                        <span style={{ color: "#f5eedc" }}>
                          {baseBalance?.displayValue
                            ? `${Number(baseBalance.displayValue).toFixed(4)}`
                            : "0.0000"}{" "}
                          {baseBalance?.symbol || "ETH"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#c7b08a",
                          marginTop: 6,
                        }}
                      >
                        <span>USDC</span>
                        <span style={{ color: "#f5eedc" }}>
                          {usdcBalance?.displayValue
                            ? `${Number(usdcBalance.displayValue).toFixed(2)}`
                            : "0.00"}{" "}
                          {usdcBalance?.symbol || "USDC"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#c7b08a",
                          marginTop: 6,
                        }}
                      >
                        <span>PATRON</span>
                        <span style={{ color: "#f5eedc" }}>
                          {patronBalance?.displayValue
                            ? `${Number(patronBalance.displayValue).toFixed(2)}`
                            : "0.00"}{" "}
                          {patronBalance?.symbol || "PATRON"}
                        </span>
                      </div>
                    </div>

                    {/* Step: join circuit */}
                    <div style={{ marginBottom: "14px", textAlign: "center" }}>
                      <button
                        className="btn btn-primary"
                        onClick={openCircuitSignup}
                        style={{ width: "100%" }}
                      >
                        Join the Cowboy Polo Circuit
                      </button>
                    </div>

                    {/* Amount + Checkout (disabled visually until connected) */}
                    <div style={{ position: "relative" }}>
                      {!isConnected && (
                        <button
                          type="button"
                          onClick={closeWallet}
                          aria-label="Connect wallet first"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.68)",
                            zIndex: 10,
                            borderRadius: 12,
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
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
                              "USPPA PATRONAGE UTILITY TOKEN · THREE SEVENS 7̶7̶7̶REMUDA · " +
                              "COWBOY POLO CIRCUIT · THE POLO WAY · CHARLESTON POLO"
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
                      This Patron Wallet works across the Cowboy Polo Circuit,{" "}
                      <a
                        href="https://uspolopatrons.org"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#e3bf72", textDecoration: "none" }}
                      >
                        USPoloPatrons.org
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://polopatronium.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#e3bf72", textDecoration: "none" }}
                      >
                        PoloPatronium.com
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CIRCUIT SIGNUP MODAL (Netlify form, wallet-linked, mobile-first) */}
      {isCircuitModalOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={closeCircuitSignup}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.86)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
            padding: "14px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #3a2b16",
                borderRadius: "14px",
                padding: "18px 16px 16px",
                background: "#050505",
                boxShadow: "0 18px 60px rgba(0,0,0,0.9)",
                fontFamily:
                  '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
                color: "#f5eedc",
                fontSize: "13px",
                position: "relative",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                  position: "relative",
                  paddingTop: "2px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#9f8a64",
                      marginBottom: "4px",
                    }}
                  >
                    Cowboy Polo Circuit
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#f5eedc",
                    }}
                  >
                    Join the Circuit
                  </div>
                </div>

                <button
                  onClick={closeCircuitSignup}
                  aria-label="Close signup"
                  title="Close"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "48px",
                    border: "none",
                    background: "transparent",
                    color: "#e3bf72",
                    fontSize: "32px",
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
                  margin: "0 0 12px",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "#dec89a",
                  textAlign: "center",
                }}
              >
                This form links your Cowboy Polo interest to your Patron Wallet so we
                can connect riders, parents, and arenas with the right chapters and
                rewards.
              </p>

              <form
                name="circuit-signup"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
              >
                {/* Netlify hidden form name */}
                <input type="hidden" name="form-name" value="circuit-signup" />

                {/* Honeypot */}
                <p style={{ display: "none" }}>
                  <label>
                    Don’t fill this out if you're human: <input name="bot-field" />
                  </label>
                </p>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="cs-name"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Name
                  </label>
                  <input
                    id="cs-name"
                    name="name"
                    type="text"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #333333",
                      background: "#050505",
                      color: "#f5eedc",
                      fontFamily: '"EB Garamond", serif',
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="cs-email"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="cs-email"
                    name="email"
                    type="email"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #333333",
                      background: "#050505",
                      color: "#f5eedc",
                      fontFamily: '"EB Garamond", serif',
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                {/* Multi-select: Interested In (check all that apply) */}
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Interested In{" "}
                    <span style={{ fontSize: "9px", opacity: 0.8 }}>
                      (check all that apply)
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "12px",
                    }}
                  >
                    {["Rider", "Parent / Guardian", "Patron", "Arena / Program", "Other"].map(
                      (label) => (
                        <label
                          key={label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="interest"
                            value={label}
                            style={{
                              width: 16,
                              height: 16,
                              accentColor: "#e3bf72",
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="cs-notes"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Notes (optional)
                  </label>

                  <textarea
                    id="cs-notes"
                    name="notes"
                    rows={4}
                    placeholder="Tell us your stable, arena, goals, and location."
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
                    This links your Circuit interest to your Patron Wallet profile.
                  </small>
                </div>

                <div style={{ marginTop: "12px", textAlign: "right" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: "8px 22px",
                      fontSize: "11px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    Submit Circuit Signup
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer>
        © <span>{year}</span> USPPA · COWBOY POLO CIRCUIT ·{" "}
        <a
          href="https://uspolopatrons.org"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#e3bf72", textDecoration: "none" }}
        >
          USPOLOPATRONS.org
        </a>{" "}
        ·{" "}
        <a
          href="https://polopatronium.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#e3bf72", textDecoration: "none" }}
        >
          PoloPatronium.com
        </a>
      </footer>
    </div>
  );
}