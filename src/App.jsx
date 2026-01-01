// src/App.jsx
import React from "react";
import "./App.css";
import { ConnectWallet, useAddress } from "@thirdweb-dev/react";

function App() {
  const address = useAddress();

  return (
    <div className="page">
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

        <div className="hero-badges">
          <div className="hero-badge-intro">INTRODUCING</div>
          <div className="three-sevens-mark">
            <div className="three-sevens-numeral">7̶7̶7̶</div>
            <div className="three-sevens-text">THREE SEVENS REMUDA</div>
          </div>
        </div>

        <div className="hero-cta-row">
          <ConnectWallet
            theme="dark"
            modalTitle="Cowboy Polo Patron Wallet"
            btnTitle={address ? "View Wallet" : "Sign up / Sign in"}
          />
        </div>

        <p className="hero-wallet-copy">
          Sign up with your email to create your Cowboy Polo Patron Wallet. After
          you sign in, you’ll receive an email with the Cowboy Polo Circuit signup
          details.
        </p>
      </section>

      {/* ABOUT / HOW IT FUNCTIONS */}
      <section id="about">
        <div className="section-header">
          <div className="section-kicker">THE FORMAT</div>
          <h2 className="section-title">HOW THE COWBOY POLO CIRCUIT WORKS</h2>
          <div className="section-rule" />
        </div>

        <div className="section-body">
          <p>
            The Cowboy Polo Circuit is a national development league for players,
            ponies, &amp; patrons built on sanctioned Cowboy Polo chukkers.
          </p>
          <p>
            Games are played 3 on 3 in arenas or campitos. The key is that a
            player does not need a full string to attract patrons: a rider can
            progress by playing as little as one chukker, on one good horse, and
            still build a real Circuit handicap.
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
            of the standings: player handicaps and team records (wins, losses,
            goal difference) together define how the season is read.
          </p>
        </div>
      </section>

      {/* PLAYER LEADERBOARD */}
      <section id="players">
        <div className="section-header">
          <div className="section-kicker">PLAYER STANDINGS</div>
          <h2 className="section-title">RIDER HANDICAP LEADERBOARD</h2>
          <div className="section-rule" />
        </div>

        <div className="section-body">
          <p>
            Player handicaps in the Cowboy Polo Circuit are not just static
            numbers. Each rider’s Cowboy Polo handicap is a statistically
            calculated, ELO-style rating, updated after every sanctioned chukker
            and displayed to two decimal places.
          </p>
          <p>
            Ratings move with performance over time: goals scored, assists,
            ride-offs won, and overall impact on the match all feed the same
            underlying score. The table below shows how a leaderboard might appear
            during mid-season.
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
      </section>

      {/* HORSE & THREE SEVENS 7̶7̶7̶ REMUDA */}
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

        <div className="section-body">
          <p>
            The Three Sevens 7̶7̶7̶ Remuda is the managed string of USPPA horses —
            tracked from their first Cowboy Polo chukker through their entire
            competitive career.
          </p>
          <p>
            Every sanctioned appearance adds to a horse’s trace: chukkers played,
            riders carried, contribution to wins, and awards earned across
            chapters and seasons. The same horse might be bred in one place,
            started by another, developed by a pro, and later carry juniors and
            patrons.
          </p>
          <p>
            By keeping a single, living record for each Remuda horse, breeders,
            trainers, players, and patrons can all see the full life of an equine
            athlete — not just a single sale moment.
          </p>
          <p>
            Over time, those records can be linked into the Patronium ecosystem so
            that the people who helped bring a horse along its path can
            participate in its economic story, not only its final ownership.
          </p>
        </div>

        <div className="board">
          <div className="board-title">Remuda Horses — Performance Snapshot</div>
          <div className="board-sub">
            Score blends chukker count, match impact, and rider feedback across
            the season.
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
      </section>

      {/* RESULTS / FORM */}
      <section id="results">
        <div className="section-header">
          <div className="section-kicker">RESULTS &amp; RECORD</div>
          <h2 className="section-title">SANCTIONED CHUKKERS &amp; SEASON RECORD</h2>
          <div className="section-rule" />
        </div>

        <div className="section-body">
          <p>
            Match captains or appointed officials submit chukker sheets: teams,
            scorelines, rider combinations, and notable horse usage. Those sheets
            become the official record that updates handicaps and team standings
            across the Circuit.
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
          {/* Netlify form name */}
          <input type="hidden" name="form-name" value="chukker-results" />
          {/* Honeypot */}
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
                <option value=">Select role</option>
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
      </section>

      <footer>
        © <span>{new Date().getFullYear()}</span> UNITED STATES POLO PATRONS
        ASSOCIATION · COWBOY POLO CIRCUIT
      </footer>
    </div>
  );
}

export default App;