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
    auth: {
      options: ["email"],
    },
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

  // Netlify form statuses
  const [circuitSubmitStatus, setCircuitSubmitStatus] = useState("idle"); // idle | submitting | success | error
  const [resultsSubmitStatus, setResultsSubmitStatus] = useState("idle"); // idle | submitting | success | error

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

  const openCircuitSignup = () => {
    if (!isConnected) return;
    setIsWalletOpen(false);
    setCircuitSubmitStatus("idle"); // reset per open
    setIsCircuitModalOpen(true);
  };

  const closeCircuitSignup = () => {
    setIsCircuitModalOpen(false);
    setCircuitSubmitStatus("idle");
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

  // --- Netlify form handlers (keep / for POST so Netlify sees them) ----

  const handleCircuitSubmit = async (e) => {
    e.preventDefault();
    setCircuitSubmitStatus("submitting");

    const form = e.target;
    const formData = new FormData(form);

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      setCircuitSubmitStatus("success");
      form.reset();
    } catch (err) {
      console.error("Circuit signup submission error:", err);
      setCircuitSubmitStatus("error");
    }
  };

  const handleResultsSubmit = async (e) => {
    e.preventDefault();
    setResultsSubmitStatus("submitting");

    const form = e.target;
    const formData = new FormData(form);

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      setResultsSubmitStatus("success");
      form.reset();
    } catch (err) {
      console.error("Chukker results submission error:", err);
      setResultsSubmitStatus("error");
    }
  };

  // Lock body scroll when ANY modal open
  const anyModalOpen = isWalletOpen || isCircuitModalOpen;

  useEffect(() => {
    if (anyModalOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      if (isWalletOpen) {
        requestAnimationFrame(() => {
          if (walletScrollRef.current) walletScrollRef.current.scrollTop = 0;
        });
      }

      return () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      };
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, [anyModalOpen, isWalletOpen]);

  // ESC closes whichever modal is open (signup first, then wallet)
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isCircuitModalOpen) {
          setIsCircuitModalOpen(false);
          setCircuitSubmitStatus("idle");
        } else if (isWalletOpen) {
          setIsWalletOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [anyModalOpen, isWalletOpen, isCircuitModalOpen]);

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

      {/* PHOTO BAND 1 (image only) */}
      <ParallaxBand
        src="/images/cowboy-1.jpeg"
        first
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* ABOUT / HOW IT FUNCTIONS section BELOW band */}
      <section
        id="about"
        ref={roadmapGateRef}
        className="band-section"
        style={{
          marginTop: "-20px",
          paddingTop: "20px",
        }}
      >
        <div className="section-header">
          <div className="section-kicker">THE FORMAT</div>
          <h2 className="section-title">HOW THE COWBOY POLO CIRCUIT WORKS</h2>
          <div className="section-rule" />
        </div>

        <div className="section-body">
          <p>
            The Cowboy Polo Circuit is a national development league for players,
            ponies, &amp; patrons built on sanctioned and recorded Cowboy Polo
            chukkers.
          </p>
          <p>
            Games are played 3 on 3 in arenas or campitos, with teams of up to 12
            riders. The key is that a player does not need a full string to play
            and attract patrons: a rider can progress by playing as little as one
            chukker, on one good horse, and still build a real Circuit handicap.
          </p>
          <p>
            Cowboy Polo chukkers can be hosted by any stable, arena, or program
            that signs on to the Circuit. A local coach, instructor, or appointed
            captains run the game, then submit the chukker sheet feeding two
            tables: the individual handicap table for each rider, and the game
            results table for teams.
          </p>
          <p>
            Each sanctioned chukker updates both sides of the story: how riders
            are rated, and how their teams are performing.
          </p>
          <p>
            Over the course of a Circuit season, those two tables are the backbone
            of the standings: player handicaps and team records together define
            how the season is read.
          </p>
          <p>
            Local chapters also feed into{" "}
            <span style={{ fontStyle: "italic" }}>The Polo Way</span>: riders and
            arenas submit 360° VR footage from sanctioned Cowboy Polo chukkers to
            thepoloway.com so patrons can follow and support the Circuit from
            anywhere.
          </p>
        </div>
      </section>

      {/* PHOTO BAND 2 (image only) */}
      <ParallaxBand
        src="/images/cowboy-2.jpeg"
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* PLAYER LEADERBOARD BELOW band */}
      <section
        id="players"
        className="band-section"
        style={{
          marginTop: "-20px",
          paddingTop: "20px",
        }}
      >
        <div className="section-header">
          <div className="section-kicker">PLAYER STANDINGS</div>
          <h2 className="section-title">RIDER HANDICAP LEADERBOARD</h2>
          <div className="section-rule" />
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "20px",
          }}
        >
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
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#f5eedc",
                  }}
                >
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
        </div>
      </section>

      {/* PHOTO BAND 3 (image only) */}
      <ParallaxBand
        src="/images/cowboy-3.jpeg"
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* HORSE & REMUDA SECTION BELOW band */}
      <section
        id="horses"
        className="band-section"
        style={{
          marginTop: "-20px",
          paddingTop: "20px",
        }}
      >
        <div className="section-header">
          <div className="section-kicker">
            <div className="three-sevens-mark">
              <div className="three-sevens-numeral">7̶7̶7̶</div>
              <div className="three-sevens-text">THREE SEVENS REMUDA</div>
            </div>
          </div>
        </div>
        <h2 className="section-title">HORSE PERFORMANCE &amp; REMUDA</h2>
        <div className="section-rule" />

        <div
          style={{
            position: "relative",
            marginTop: "20px",
          }}
        >
          {!isConnected && (
            <div
              onClick={openWallet}
              aria-label="Sign in required to view Remuda tables"
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
                  REMUDA &amp; HORSE PERFORMANCE
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#f5eedc",
                  }}
                >
                  Sign into your Patron Wallet to view tracked horses and Remuda
                  performance.
                </div>
              </div>
            </div>
          )}

          <div aria-hidden={!isConnected && true}>
            <div className="section-body">
              <p>
                The Three Sevens 7̶7̶7̶ Remuda is the managed string of USPPA
                horses — brought up inside the Cowboy Polo Circuit and tracked
                from their first saddle miles to their final retirement. We
                don&apos;t buy finished polo ponies; we make them. Every horse that
                enters the 7̶7̶7̶ Remuda is a training project, and riders in the
                Circuit learn not only how to play, but how to help produce a
                polo horse.
              </p>
              <p>
                Every sanctioned appearance adds to a horse&apos;s career record:
                chukkers played, riders carried, contribution to wins, and awards
                earned across chapters and seasons. The same horse might be bred
                in one place, started by another, developed by a pro, and later
                carry juniors, patrons, and finally step down into lesson,
                therapy, or pasture retirement.
              </p>
              <p>
                By keeping a single, living record for each Remuda horse,
                breeders, trainers, players, and patrons can see the whole life
                cycle of an equine athlete — not just a single sale moment.
              </p>
              <p>
                Those records will be linked into the Polo Patronium ecosystem so
                that the people who helped bring a horse along its path can
                participate in its economic story across its working life and into
                retirement.
              </p>
            </div>

            <div className="board">
              <div className="board-title">
                Remuda Horses — Performance Snapshot
              </div>
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
                <span>6666</span>
                <span>81</span>
              </div>
              <div className="board-row">
                <span>River Scout</span>
                <span>
                  C<span style={{ fontSize: "0.75em", verticalAlign: "sub" }}>
                    P
                  </span>
                </span>
                <span>79</span>
              </div>
            </div>
          </div>
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
              {/* Modal header: USPPA / Cowboy Polo Circuit / Patron Wallet */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px",
                  position: "relative",
                  paddingTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "#9f8a64",
                    }}
                  >
                    U&nbsp;S&nbsp;P&nbsp;P&nbsp;A
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#f5eedc",
                    }}
                  >
                    Cowboy Polo Circuit
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                    }}
                  >
                    Patron Wallet
                  </div>
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

              {/* Explanatory copy under title (ONLY when not signed in) */}
              {!account && (
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
                  Wallet. This same wallet works on{" "}
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
              )}

              {/* Connect or account view */}
              {!account ? (
                <div style={{ marginBottom: "14px" }}>
                  <ConnectEmbed
                    client={client}
                    wallets={wallets}
                    chain={BASE}
                    theme={patronCheckoutTheme}
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

                  {/* Gas + USDC */}
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

                  {/* Patron balance */}
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

              {/* NEXT STEPS CTA */}
              <div
                style={{
                  marginBottom: "16px",
                  marginTop: "4px",
                  padding: "10px 10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(234,191,114,0.25)",
                  background: "rgba(5,5,5,0.9)",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#c7b08a",
                    marginBottom: "6px",
                    textAlign: "center",
                  }}
                >
                  Next Steps
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={openCircuitSignup}
                  disabled={!isConnected}
                  style={{
                    width: "100%",
                    padding: "8px 20px",
                    fontSize: "11px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    background: "#e3bf72",
                    color: "#181210",
                    borderColor: "#e3bf72",
                    opacity: isConnected ? 1 : 0.45,
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
                    Connect or create your Patron Wallet above to enable this
                    step.
                  </div>
                )}
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
                      name={"BUY POLO PATRONIUM (PATRON)"}
                      description={
                        "USPPA PATRONAGE UTILITY TOKEN · THREE SEVENS 7̶7̶7̶ REMUDA · COWBOY POLO CIRCUIT · THE POLO WAY · CHARLESTON POLO"
                      }
                      currency={"USD"}
                      chain={BASE}
                      amount={normalizedAmountNumber}
                      tokenAddress={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}
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
                This form links your Cowboy Polo interest to your Patron Wallet
                so we can connect riders, parents, and arenas with the right
                chapters and rewards.
              </p>

              <form
                name="circuit-signup"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleCircuitSubmit}
              >
                {/* Netlify hidden form name */}
                <input type="hidden" name="form-name" value="circuit-signup" />
                {/* Honeypot */}
                <p style={{ display: "none" }}>
                  <label>
                    Don’t fill this out if you're human:
                    <input name="bot-field" />
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
                    {[
                      "Rider",
                      "Parent / Guardian",
                      "Patron",
                      "Arena / Program",
                      "Other",
                    ].map((label) => (
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
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="cs-chapter"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#c7b08a",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Chapter / City / Arena
                  </label>
                  <input
                    id="cs-chapter"
                    name="chapter"
                    type="text"
                    placeholder="Charleston, SC · Creek Plantation, etc."
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
                    Notes
                  </label>
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

                <div
                  style={{
                    marginTop: "12px",
                    textAlign: "right",
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: "8px 22px",
                      fontSize: "11px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      opacity: circuitSubmitStatus === "submitting" ? 0.7 : 1,
                      cursor:
                        circuitSubmitStatus === "submitting"
                          ? "wait"
                          : "pointer",
                    }}
                    disabled={circuitSubmitStatus === "submitting"}
                  >
                    {circuitSubmitStatus === "submitting"
                      ? "Submitting…"
                      : "Submit Circuit Signup"}
                  </button>
                </div>

                {circuitSubmitStatus === "success" && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#4ade80",
                      textAlign: "center",
                    }}
                  >
                    Thank you — your Circuit signup was received.
                  </p>
                )}
                {circuitSubmitStatus === "error" && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#f97373",
                      textAlign: "center",
                    }}
                  >
                    Something went wrong submitting the form. Please try again.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS / NETLIFY FORM (GATED) */}
      <section id="results">
        <div className="section-header">
          <div className="section-kicker">RESULTS &amp; RECORD</div>
          <h2 className="section-title">
            SANCTIONED CHUKKERS &amp; SEASON RECORD
          </h2>
          <div className="section-rule" />
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "20px",
          }}
        >
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
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#f5eedc",
                  }}
                >
                  Sign into your Patron Wallet to submit official chukker
                  results and season records.
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
              onSubmit={handleResultsSubmit}
            >
              <input type="hidden" name="form-name" value="chukker-results" />
              <p style={{ display: "none" }}>
                <label>
                  Don’t fill this out if you're human:
                  <input name="bot-field" />
                </label>
              </p>

              {/* Wallet address – visible + hidden copy for Netlify */}
              <div>
                <label htmlFor="cr-wallet">Linked Wallet</label>
                <input
                  id="cr-wallet"
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

              <div className="results-form-row-inline">
                <div>
                  <label htmlFor="name">Your Name</label>
                  <input id="name" name="name" type="text" required />
                </div>
                <div>
                  <label htmlFor="role">Role</label>
                  <select id="role" name="role" required>
                    <option value="">Select role</option>
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
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={resultsSubmitStatus === "submitting"}
                  style={{
                    opacity: resultsSubmitStatus === "submitting" ? 0.7 : 1,
                    cursor:
                      resultsSubmitStatus === "submitting"
                        ? "wait"
                        : "pointer",
                  }}
                >
                  {resultsSubmitStatus === "submitting"
                    ? "Submitting…"
                    : "SUBMIT CHUKKER RESULTS"}
                </button>
              </div>

              {resultsSubmitStatus === "success" && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "#4ade80",
                    textAlign: "right",
                  }}
                >
                  Chukker results submitted. Thank you.
                </p>
              )}
              {resultsSubmitStatus === "error" && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "#f97373",
                    textAlign: "right",
                  }}
                >
                  There was a problem submitting results. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

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
