// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";

import {
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
// Pan + sticky image scene with overlay content
// direction:
//   "rtl" = pan from right ➜ left
//   "ltr" = pan from left ➜ right
// ---------------------------------------------
function PanScene({ src, direction = "ltr", first = false, children }) {
  const sceneRef = useRef(null);
  const stickyRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!sceneRef.current || !stickyRef.current || !imgRef.current) return;

    let raf = 0;
    let maxShift = 0;

    const computeMaxShift = () => {
      if (!stickyRef.current || !imgRef.current) return;
      const cw = stickyRef.current.clientWidth;
      const iw = imgRef.current.clientWidth;
      maxShift = Math.max(iw - cw, 0);
    };

    const update = () => {
      if (!sceneRef.current || !imgRef.current) return;

      const rect = sceneRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const totalScrollable = rect.height - vh;

      if (totalScrollable <= 0 || maxShift <= 0) {
        imgRef.current.style.transform = "translate3d(0,0,0)";
        return;
      }

      const raw = -rect.top / totalScrollable;
      const progress = Math.min(Math.max(raw, 0), 1);

      let shift = 0;

      // left-to-right: start left, end right
      if (direction === "ltr") {
        shift = -maxShift * progress;
      }
      // right-to-left: start right, end left
      else if (direction === "rtl") {
        shift = -maxShift * (1 - progress);
      } else {
        // default fallback
        shift = -maxShift * progress;
      }

      imgRef.current.style.transform = `translate3d(${shift}px,0,0)`;
    };

    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    const handleResize = () => {
      computeMaxShift();
      update();
    };

    computeMaxShift();
    update();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [direction]);

  const handleImgLoad = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  };

  return (
    <section
      ref={sceneRef}
      className={`pan-scene full-bleed ${first ? "pan-scene-first" : ""}`}
    >
      <div ref={stickyRef} className="pan-scene-media">
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="pan-scene-img"
          onLoad={handleImgLoad}
        />
        <div className="pan-scene-vignette" aria-hidden="true" />
      </div>

      <div className="pan-scene-content">{children}</div>
    </section>
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

      {/* SCENE 1: first photo (right ➜ left) + ABOUT text */}
      <PanScene src="/images/cowboy-1.jpeg" direction="rtl" first>
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
              Cowboy Polo chukkers can be hosted by any stable, arena, or
              program that signs on to the Circuit. A local coach, instructor,
              or appointed captains run the game, then submit the chukker sheet
              feeding two tables: the individual handicap table for each rider,
              and the game results table for teams.
            </p>
            <p>
              Each sanctioned chukker updates both sides of the story: how
              riders are rated, and how their teams are performing.
            </p>
            <p>
              Over the course of a Circuit season, those two tables are the
              backbone of the standings: player handicaps and team records
              (wins, losses, goal difference) together define how the season is
              read.
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
      </PanScene>

      {/* SCENE 2: second photo (left ➜ right) + PLAYER LEADERBOARD */}
      <PanScene src="/images/cowboy-2.jpeg" direction="ltr">
        <section id="players">
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
                  background: "rgba(0,0,0,0.25)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
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
                    Sign into your Patron Wallet to view live rider handicaps
                    and Circuit tables.
                  </div>
                </div>
              </div>
            )}

            <div aria-hidden={!isConnected && true}>
              <div className="section-body">
                <p>
                  Player handicaps in the Cowboy Polo Circuit are not just
                  static numbers. Each rider’s Cowboy Polo handicap is a
                  statistically calculated, ELO-style rating, updated after
                  every sanctioned chukker and displayed to two decimal places.
                </p>
                <p>
                  Ratings move with performance over time: goals scored,
                  assists, ride-offs won, and overall impact on the match all
                  feed the same underlying score. The table below shows how a
                  leaderboard might appear during mid-season.
                </p>
              </div>

              <div className="board">
                <div className="board-title">
                  Top Riders — Mid-Season Snapshot
                </div>
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
      </PanScene>

      {/* SCENE 3: third photo (right ➜ left) + HORSES / REMUDA */}
      <PanScene src="/images/cowboy-3.jpeg" direction="rtl">
        <section id="horses">
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
                  background: "rgba(0,0,0,0.25)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
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
                    Sign into your Patron Wallet to view tracked horses and
                    Remuda performance.
                  </div>
                </div>
              </div>
            )}

            <div aria-hidden={!isConnected && true}>
              <div className="section-body">
                <p>
                  The Three Sevens 7̶7̶7̶ Remuda is the managed string of USPPA
                  horses — tracked from their first Cowboy Polo chukker through
                  their entire competitive career.
                </p>
                <p>
                  Every sanctioned appearance adds to a horse’s trace: chukkers
                  played, riders carried, contribution to wins, and awards
                  earned across chapters and seasons. The same horse might be
                  bred in one place, started by another, developed by a pro,
                  and later carry juniors and patrons.
                </p>
                <p>
                  By keeping a single, living record for each Remuda horse,
                  breeders, trainers, players, and patrons can all see the full
                  life of an equine athlete — not just a single sale moment.
                </p>
                <p>
                  Over time, those records can be linked into the Patronium
                  ecosystem so that the people who helped bring a horse along
                  its path can participate in its economic story, not only its
                  final ownership.
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
          </div>
        </section>
      </PanScene>

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
                background: "rgba(0,0,0,0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
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
        </div>
      </section>

      <footer>
        © <span>{year}</span> UNITED STATES POLO PATRONS ASSOCIATION · COWBOY
        POLO CIRCUIT
      </footer>
    </div>
  );
}