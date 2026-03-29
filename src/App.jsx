import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import PatronWalletPanel from "./PatronWalletPanel";

import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useWalletBalance,
  darkTheme,
} from "thirdweb/react";
import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";

// ---------------------------------------------
// Thirdweb client + chain
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
// Theme
// ---------------------------------------------
const patronCheckoutTheme = darkTheme({
  fontFamily:
    '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
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
// Error boundary for CheckoutWidget
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
// Zoom-on-scroll photo band
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
      className={`parallax-band full-bleed ${
        first ? "parallax-band-first" : ""
      }`}
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
// Simple hash-based routing
// ---------------------------------------------
function getRouteFromHash() {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "/wallet" || hash === "wallet") return "wallet";
  return "home";
}

// ---------------------------------------------
// Main App
// ---------------------------------------------
export default function App() {
  const year = new Date().getFullYear();

  // Route from hash (#/wallet vs default)
  const [route, setRoute] = useState(getRouteFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(getRouteFromHash());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Wallet / modal state (for main page)
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [usdAmount, setUsdAmount] = useState("1");
  const walletScrollRef = useRef(null);

  // Netlify form statuses
  const [resultsSubmitStatus, setResultsSubmitStatus] = useState("idle");

  // Scroll-gating state
  const [hasTriggeredGate, setHasTriggeredGate] = useState(false);
  const roadmapGateRef = useRef(null); // now used as bottom-of-page sentinel

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

  const openWalletModal = () => setIsWalletOpen(true);
  const closeWalletModal = () => setIsWalletOpen(false);

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

  // Amount normalization
  const normalizedAmountNumber =
    usdAmount && Number(usdAmount) > 0 ? Number(usdAmount) : 1;
  const normalizedAmount = String(normalizedAmountNumber);

  const handleCheckoutSuccess = async (result) => {
    console.log("Checkout success:", result);
    alert(
      "Payment received.\n\n" +
        "PATRON will be credited to your wallet automatically.\n" +
        "If you do not see it shortly, contact support with your wallet address."
    );
  };

  const handleCheckoutError = (err) => {
    console.error("Checkout error:", err);
    alert(err?.message || String(err));
  };

  // Netlify forms
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

  // Lock body scroll when wallet modal open
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

  // ESC closes wallet modal
  useEffect(() => {
    if (!isWalletOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsWalletOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWalletOpen]);

  // Scroll gating on main page — now uses a bottom-of-page sentinel
  useEffect(() => {
    if (route !== "home") return; // only on main page

    if (isConnected) {
      setHasTriggeredGate(false);
      return;
    }

    const handleScroll = () => {
      if (hasTriggeredGate) return;
      const el = roadmapGateRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const isVisible = rect.top < vh && rect.bottom > 0;

      if (isVisible) {
        setHasTriggeredGate(true);
        setIsWalletOpen(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [route, isConnected, hasTriggeredGate]);

  // ---------------------------------------------
  // Shared footer (both routes)
  // ---------------------------------------------
  const renderFooter = () => (
    <footer className="site-footer">
      <div className="footer-panels">
        {/* USPPA block */}
        <div className="footer-panel">
          <div className="footer-kicker">NATIONAL PATRON BODY</div>
          <div className="footer-title">
            UNITED STATES POLO
            <br />
            PATRONS ASSOCIATION
          </div>
          <p className="footer-copy">
            The USPPA is a patrons&apos; association focused on building a
            broader base of support for players, horses, and local clubs across
            the country.
          </p>
          <a href="https://uspolopatrons.org" className="btn btn-footer">
            Visit USPPA
          </a>
        </div>

        {/* Polo Patronium block */}
        <div className="footer-panel">
          <div className="footer-kicker">OFFICIAL TOKEN</div>
          <div className="footer-title">POLO PATRONIUM</div>
          <div className="footer-subtitle">
            SYMBOL &quot;PATRON&quot; · BUILT ON BASE
          </div>
          <p className="footer-copy">
            A patronage utility token and membership initiative uniting patrons,
            players, and clubs in a shared economy of sport.
          </p>
          <a href="https://polopatronium.com" className="btn btn-footer">
            PoloPatronium.com
          </a>
        </div>
      </div>

      <div className="footer-meta">
        © <span>{year}</span> USPPA · Cowboy Polo Circuit
      </div>
    </footer>
  );

  // ---------------------------------------------
  // Standalone wallet page for #/wallet
  // ---------------------------------------------
  if (route === "wallet") {
    return (
      <div className="page">
        <header
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "8px 0 0",
            marginBottom: "12px",
          }}
        >
          <button
            className="btn btn-outline btn-small"
            style={{
              minWidth: "auto",
              padding: "6px 16px",
              fontSize: "0.7rem",
            }}
            onClick={() => {
              window.location.hash = "";
            }}
          >
            ← Back to Cowboy Polo
          </button>
        </header>

        <section>
          <div style={{ maxWidth: 420, margin: "18px auto 0" }}>
            <div
              ref={walletScrollRef}
              style={{
                width: "100%",
                maxHeight: "none",
                overflowY: "visible",
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
              <PatronWalletPanel
                account={account}
                isConnected={isConnected}
                shortAddress={shortAddress}
                handleCopyAddress={handleCopyAddress}
                baseBalance={baseBalance}
                usdcBalance={usdcBalance}
                patronBalance={patronBalance}
                handleSignOut={handleSignOut}
                usdAmount={usdAmount}
                setUsdAmount={setUsdAmount}
                normalizedAmount={normalizedAmount}
                client={client}
                wallets={wallets}
                BASE={BASE}
                patronCheckoutTheme={patronCheckoutTheme}
                handleCheckoutSuccess={handleCheckoutSuccess}
                handleCheckoutError={handleCheckoutError}
                CheckoutBoundary={CheckoutBoundary}
                showDashboardTabs={true}
              />
            </div>
          </div>
        </section>

        {renderFooter()}
      </div>
    );
  }

  // ---------------------------------------------
  // Main Cowboy Polo page (route === "home")
  // ---------------------------------------------
  return (
    <div className="page">
      {/* Top header: now links to dedicated wallet page */}
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 0 0",
          marginBottom: "8px",
        }}
      >
        <a
          href="#/wallet"
          className="btn btn-outline"
          style={{ minWidth: "auto", padding: "6px 20px" }}
        >
          PATRON WALLET
        </a>
      </header>

      {/* HERO */}
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

        <div
          className="hero-rule-2"
          style={{ marginTop: "18px", marginBottom: "18px" }}
        />

        <div className="hero-badges">
          <div className="hero-badge-intro">INTRODUCING</div>
          <div className="three-sevens-mark">
            <div className="three-sevens-numeral">7̶7̶7̶</div>
            <div className="three-sevens-text">THREE SEVENS REMUDA</div>
          </div>
        </div>

        <a href="#/wallet" className="btn btn-primary">
  Sign up / Sign in
</a>
          
          
        </div>
      </section>

      <ParallaxBand
        src="/images/cowboy-1.jpeg"
        first
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* ABOUT */}
      <section
        id="about"
        className="band-section"
        style={{ marginTop: "-20px", paddingTop: "20px" }}
      >
        <div className="section-header">
          <div className="section-kicker">THE FORMAT</div>
          <h2 className="section-title">HOW THE COWBOY POLO CIRCUIT WORKS</h2>
        </div>

        <div className="section-body">
          <p>
            The Cowboy Polo Circuit is a US development league for players,
            ponies, and patrons, built on sanctioned Cowboy Polo chukkers, with
            a long-term focus on training ponies and the player-trainers who
            bring them along.
          </p>
          <p>
            Games are played 3 on 3 in arenas or campitos, with teams of up to
            12 riders. The key here is that a player no longer needs a full
            string to play polo and attract patrons: a rider can progress by
            playing one chukker, on one good horse, building a real Cowboy Polo
            handicap. Riders simply play on one solid, safe horse from home or
            their program and grow into a string over time.
          </p>
          <p>
            Before entering official chukkers, every new rider and horse pair
            attends a Cowboy Polo Tryout Clinic. This short, focused session
            evaluates basic polo skill levels, places them into further
            schooling, practices or live chukkers, and teaches the shared
            &quot;rules of the road&quot; that keep mixed-level games safe and
            exciting.
          </p>
          <p>
            This Circuit is intentionally built around the training of ponies as
            integral to the sport, rather than just paying to ride finished
            mounts. Cowboy Polo is a schoolhouse: student players are trained to
            train their horses, and every sanctioned chukker doubles as
            structured schooling miles for both horse and rider.
          </p>
          <p>
            Cowboy Polo chukkers can be hosted by stables, arenas, or programs
            that sign on to the Circuit. Appointed chapter captains run the
            game, then submit the chukker sheet feeding two tables: the
            individual handicap table for each rider, and the game results table
            for teams.
          </p>
          <p>
            Each sanctioned chukker updates both sides of the story: how riders
            are rated, and how their teams are performing.
          </p>
          <p>
            Over the course of a Circuit season, those two tables are the
            backbone of the standings: player handicaps and team records
            together define how the season is read.
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

      <ParallaxBand
        src="/images/cowboy-2.jpeg"
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* PLAYER LEADERBOARD */}
      <section
        id="players"
        className="band-section"
        style={{ marginTop: "-20px", paddingTop: "20px" }}
      >
        <div className="section-header">
          <div className="section-kicker">PLAYER STANDINGS</div>
          <h2 className="section-title">RIDER HANDICAP LEADERBOARD</h2>
        </div>

        <div style={{ position: "relative", marginTop: "20px" }}>
          <div>
            <div className="section-body">
              <p>
                Player handicaps in the Cowboy Polo Circuit are not just static
                numbers. Each rider’s Cowboy Polo handicap is a statistically
                calculated, ELO-style rating, updated after every sanctioned
                chukker and displayed to two decimal places.
              </p>
              <p>
                Ratings move with performance over time: goals scored, assists,
                and overall impact on the chuckers all feed the same underlying
                score.
              </p>
              <p>
                As riders climb the Cowboy Polo ladder, they move from local
                development chukkers into featured Circuit and pro-grade events.
                Riders who go pro will plug into the same patronage engine, with
                a portion of Cowboy Polo event and streaming revenue reserved as
                Patron Tribute for the players, horses, and chapters that
                carried them there.
              </p>
            </div>

            <div className="board">
              <div className="board-title">Top Riders — Snapshot</div>
              <div className="board-sub">
                Handicaps update as sanctioned results are submitted.
              </div>

              <div className="board-header">
                <span>Rider</span>
                <span>Chapter</span>
                <span>Handicap</span>
              </div>
              <div className="board-row">
                <span>Ryder M</span>
                <span>Charleston Polo</span>
                <span className="handicap-value">
                  <span className="handicap-value-main">5</span>
                  <span className="handicap-value-decimal">.15</span>
                </span>
              </div>
              <div className="board-row">
                <span>Casey N</span>
                <span>Virtue Duce</span>
                <span className="handicap-value">
                  <span className="handicap-value-main">3</span>
                  <span className="handicap-value-decimal">.40</span>
                </span>
              </div>
              <div className="board-row">
                <span>Jess C</span>
                <span>6666 Polo</span>
                <span className="handicap-value">
                  <span className="handicap-value-main">4</span>
                  <span className="handicap-value-decimal">.25</span>
                </span>
              </div>
              <div className="board-row">
                <span>Lane D</span>
                <span>Creek Plantation</span>
                <span className="handicap-value">
                  <span className="handicap-value-main">6</span>
                  <span className="handicap-value-decimal">.85</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ParallaxBand
        src="/images/cowboy-3.jpeg"
        zoom={30}
        speed={0.1}
        finishFactor={2}
      />

      {/* HORSE & REMUDA */}
      <section
        id="horses"
        className="band-section"
        style={{ marginTop: "-20px", paddingTop: "20px" }}
      >
        <div className="section-header">
          <div className="section-kicker">
            <div className="three-sevens-mark">
              <div className="three-sevens-numeral">7̶7̶7̶</div>
              <div className="three-sevens-text">THREE SEVENS REMUDA</div>
            </div>
          </div>
        </div>
        <h2 className="section-title" style={{ textAlign: "center" }}>
          HORSE PERFORMANCE &amp; REMUDA
        </h2>

        <div style={{ position: "relative", marginTop: "20px" }}>
          <div>
            <div className="section-body">
              <p>
                The Three Sevens 7̶7̶7̶ Remuda is the managed herd of USPPA
                horses — trained inside the Cowboy Polo Circuit and tracked from
                their first start to their retirement. It is built first by
                training and seasoning ponies in the Cowboy Polo way.
              </p>
              <p>
                Riders can bring their own horses into the same training
                pipeline. Whether a horse starts in a local lesson program, a
                ranch string, or a private barn, Cowboy Polo Tryout Clinics and
                sanctioned chukkers provide a structured path to turn good
                horses into true polo ponies — while student players learn, step
                by step, how to train and develop those ponies themselves.
              </p>
              <p>
                For patrons, the Three Sevens 7̶7̶7̶ Remuda is where patron
                tokens go to work. Patrons can stake their PATRON tokens behind
                specific horses, players, and teams to help fund daily training,
                clinics, and schooling chukkers. As those horses and student
                trainers progress through the Circuit, Patron Tribute from
                Cowboy Polo events and related revenue is directed back through
                the same patron pools, so long-term supporters stay connected to
                the careers they helped build.
              </p>
            </div>

            <div className="board">
              <div className="board-title">Pony Performance Snapshot</div>
              <div className="board-sub">
                Score blends chukker count, impact, and rider feedback across
                the season.
              </div>

              <div className="board-header">
                <span>Horse</span>
                <span>Circuit Brand</span>
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
                <span>91</span>
              </div>
              <div className="board-row">
                <span>River Scout</span>
                <span>
                  C<span style={{ fontSize: "0.75em", verticalAlign: "sub" }}>
                    P
                  </span>
                </span>
                <span>98</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WALLET MODAL (main page) */}
      {isWalletOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={closeWalletModal}
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
              <PatronWalletPanel
                account={account}
                isConnected={isConnected}
                shortAddress={shortAddress}
                handleCopyAddress={handleCopyAddress}
                baseBalance={baseBalance}
                usdcBalance={usdcBalance}
                patronBalance={patronBalance}
                handleSignOut={handleSignOut}
                usdAmount={usdAmount}
                setUsdAmount={setUsdAmount}
                normalizedAmount={normalizedAmount}
                client={client}
                wallets={wallets}
                BASE={BASE}
                patronCheckoutTheme={patronCheckoutTheme}
                handleCheckoutSuccess={handleCheckoutSuccess}
                handleCheckoutError={handleCheckoutError}
                CheckoutBoundary={CheckoutBoundary}
                showCloseButton={true}
                onClose={closeWalletModal}
                closeOnDisabledOverlay={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      <section id="results">
        <div className="section-header">
          <div className="section-kicker">RESULTS &amp; RECORD</div>
          <h2 className="section-title">
            SANCTIONED CHUKKERS &amp; SEASON RECORD
          </h2>
        </div>

        <div style={{ position: "relative", marginTop: "20px" }}>
          <div>
            <div className="section-body">
              <p>
                Match captains or appointed officials submit chukker sheets:
                teams, scorelines, rider combinations, and notable horse usage.
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
              <input
                type="hidden"
                name="form-name"
                value="chukker-results"
              />
              <p style={{ display: "none" }}>
                <label>
                  Don’t fill this out if you're human:
                  <input name="bot-field" />
                </label>
              </p>

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
                    opacity:
                      resultsSubmitStatus === "submitting" ? 0.7 : 1,
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

      {/* NEW: bottom-of-page scroll trigger sentinel */}
      <div ref={roadmapGateRef} style={{ height: 1, width: "100%" }} />

      {renderFooter()}
    </div>
  );
}