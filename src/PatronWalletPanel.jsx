import React, { useState } from "react";
import { ConnectEmbed, CheckoutWidget } from "thirdweb/react";

const COLORS = {
  page: "#031129",
  panel: "#071936",
  panelDeep: "#06152c",
  panelRaised: "#0b2342",
  panelSoft: "#102b4e",
  panelHighlight: "#15345a",

  border: "#4a3a1e",
  borderSoft: "rgba(227, 191, 114, 0.18)",
  borderMedium: "rgba(227, 191, 114, 0.28)",
  borderBright: "rgba(227, 191, 114, 0.42)",

  gold: "#e3bf72",
  goldLight: "#e8d09a",
  goldSoft: "#c7b08a",
  goldMuted: "#9f8a64",
  goldPale: "#dec89a",

  cream: "#f5eedc",

  danger: "#f97373",
  success: "#4ade80",
};

const CARD_STYLE = {
  marginBottom: "14px",
  padding: "12px",
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  background:
    "linear-gradient(180deg, rgba(16,43,78,0.92), rgba(7,25,54,0.98))",
  boxShadow: "0 12px 30px rgba(1, 7, 20, 0.24)",
};

const FIELD_STYLE = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.panelDeep,
  color: COLORS.cream,
  fontSize: 14,
  outline: "none",
  boxShadow: "0 10px 30px rgba(1, 7, 20, 0.28)",
};

const FORM_FIELD_STYLE = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #334b70",
  background: COLORS.panelDeep,
  color: COLORS.cream,
  fontFamily: '"EB Garamond", serif',
  fontSize: "0.95rem",
};

export default function PatronWalletPanel({
  account,
  isConnected,
  shortAddress,
  handleCopyAddress,
  baseBalance,
  usdcBalance,
  patronBalance,
  handleSignOut,
  usdAmount,
  setUsdAmount,
  normalizedAmount,
  purchasePurpose,
  setPurchasePurpose,
  selectedPackage,
  setSelectedPackage,
  client,
  wallets,
  BASE,
  patronCheckoutTheme,
  handleCheckoutSuccess,
  handleCheckoutError,
  CheckoutBoundary,
  showCloseButton = false,
  onClose = null,
  closeOnDisabledOverlay = false,
  showDashboardTabs = false,
}) {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationSubmitStatus, setRegistrationSubmitStatus] =
    useState("idle");

  const carePackages = {
    "4-rides": {
      amount: "500",
      label: "$500 — supports up to 4 rides",
      description:
        "Monthly care contribution with up to 4 ride credits available.",
    },
    "5-rides": {
      amount: "615",
      label: "$615 — supports up to 5 rides",
      description:
        "Monthly care contribution with up to 5 ride credits available.",
    },
    "6-rides": {
      amount: "720",
      label: "$720 — supports up to 6 rides",
      description:
        "Monthly care contribution with up to 6 ride credits available.",
    },
    "7-rides": {
      amount: "825",
      label: "$825 — supports up to 7 rides",
      description:
        "Monthly care contribution with up to 7 ride credits available.",
    },
    "8-rides": {
      amount: "920",
      label: "$920 — supports up to 8 rides",
      description:
        "Monthly care contribution with up to 8 ride credits available.",
    },
    custom: {
      amount: usdAmount,
      label: "Custom amount",
      description:
        "Choose a custom patronage amount for horse care, welfare, lease support, or general patron support.",
    },
  };

  const currentPackage =
    carePackages[selectedPackage] || carePackages["4-rides"];

  const openRegistration = () => {
    if (!isConnected) return;

    setRegistrationSubmitStatus("idle");
    setIsRegistrationOpen(true);
  };

  const closeRegistration = () => {
    setIsRegistrationOpen(false);
    setRegistrationSubmitStatus("idle");
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegistrationSubmitStatus("submitting");

    const form = e.target;
    const formData = new FormData(form);

    try {
      await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formData).toString(),
      });

      setRegistrationSubmitStatus("success");
      form.reset();
    } catch (err) {
      console.error("Registration submission error:", err);
      setRegistrationSubmitStatus("error");
    }
  };

  const renderOrgLogo = () => (
    <div
      style={{
        textAlign: "center",
        margin: "2px auto 16px",
        paddingBottom: "14px",
        borderBottom: `1px solid ${COLORS.borderMedium}`,
        color: COLORS.gold,
      }}
    >
      <div
        style={{
          fontFamily: '"Cinzel", "Cormorant Garamond", serif',
          fontSize: "11px",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: "#d8bd82",
          marginBottom: "12px",
          whiteSpace: "nowrap",
        }}
      >
        US <span style={{ letterSpacing: 0, margin: "0 0.2em" }}>✠</span> AR{" "}
        <span style={{ letterSpacing: 0, margin: "0 0.2em" }}>✠</span> CA{" "}
        <span style={{ letterSpacing: 0, margin: "0 0.2em" }}>✠</span> UK
      </div>

      <div
        style={{
          fontFamily: '"Cinzel", "Cormorant Garamond", serif',
          fontSize: "clamp(1.45rem, 6vw, 2rem)",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: COLORS.goldLight,
          lineHeight: 1.12,
          marginLeft: "0.28em",
          whiteSpace: "nowrap",
        }}
      >
        Polo Patrons
      </div>

      <div
        style={{
          fontFamily: '"Cinzel", "Cormorant Garamond", serif',
          fontSize: "13px",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: "#d8c79f",
          marginTop: "10px",
          marginLeft: "0.42em",
          whiteSpace: "nowrap",
        }}
      >
        Association
      </div>
    </div>
  );

  const renderWalletHeader = () => (
    <div
      style={{
        marginBottom: "8px",
        position: "relative",
        paddingTop: "4px",
      }}
    >
      {renderOrgLogo()}

      <div
        style={{
          textAlign: "center",
          fontSize: "11px",
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: COLORS.goldSoft,
          marginTop: "-6px",
          marginBottom: "10px",
        }}
      >
        Patron Wallet
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close wallet"
          title="Close"
          style={{
            position: "absolute",
            right: 0,
            top: "2px",
            width: "56px",
            height: "56px",
            border: "none",
            background: "transparent",
            color: COLORS.gold,
            fontSize: "38px",
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ×
        </button>
      )}
    </div>
  );

  const renderConnectOrAccount = () => (
    <>
      {!account && (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: "12px",
            lineHeight: 1.5,
            textAlign: "center",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.goldPale,
          }}
        >
          Sign up with your email to create your Polo Patrons Wallet. This same
          wallet works on{" "}
          <a
            href="https://uspolopatrons.org"
            target="_blank"
            rel="noreferrer"
            style={{
              color: COLORS.gold,
              textDecoration: "none",
            }}
          >
            USPoloPatrons.org
          </a>{" "}
          and{" "}
          <a
            href="https://polopatronium.com"
            target="_blank"
            rel="noreferrer"
            style={{
              color: COLORS.gold,
              textDecoration: "none",
            }}
          >
            PoloPatronium.com
          </a>
          .
        </p>
      )}

      {!account ? (
        <div
          style={{
            marginBottom: "14px",
            borderRadius: "16px",
            overflow: "hidden",
            background: COLORS.panelRaised,
          }}
        >
          <ConnectEmbed
            client={client}
            wallets={wallets}
            chain={BASE}
            theme={patronCheckoutTheme}
          />
        </div>
      ) : (
        <div
          style={{
            marginBottom: "14px",
            textAlign: "center",
          }}
        >
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
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                color: COLORS.cream,
              }}
            >
              {shortAddress}
            </div>

            <button
              type="button"
              onClick={handleCopyAddress}
              style={{
                border: "none",
                background: "transparent",
                color: COLORS.gold,
                cursor: "pointer",
                fontSize: "14px",
              }}
              aria-label="Copy wallet address"
            >
              📋
            </button>
          </div>

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
                  color: COLORS.goldMuted,
                  marginBottom: "2px",
                }}
              >
                Gas
              </div>

              <div
                style={{
                  color: COLORS.cream,
                  fontSize: "13px",
                }}
              >
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
                  color: COLORS.goldMuted,
                  marginBottom: "2px",
                }}
              >
                USDC
              </div>

              <div
                style={{
                  color: COLORS.cream,
                  fontSize: "13px",
                }}
              >
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
                color: COLORS.goldSoft,
                marginBottom: "4px",
              }}
            >
              Patronium Balance
            </div>

            <div
              style={{
                fontSize: "18px",
                letterSpacing: "0.02em",
                color: COLORS.cream,
              }}
            >
              {patronBalance?.displayValue || "0"}{" "}
              {patronBalance?.symbol || "PATRON"}
            </div>
          </div>

          <button
            type="button"
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
    </>
  );

  const renderStatusCard = () => {
    const label = isConnected ? "Anonymous Holder" : "Guest";

    const copy = isConnected
      ? "You can buy PATRON and support founding initiatives now. Complete registration to unlock lessons, bookings, and fuller member access."
      : "Sign in to buy PATRON, support founding initiatives, and begin your patron profile.";

    return (
      <div
        style={{
          ...CARD_STYLE,
          background:
            "radial-gradient(circle at top, rgba(227,191,114,0.09), rgba(11,35,66,0.96) 48%, rgba(7,25,54,0.99) 100%)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.goldSoft,
            marginBottom: "8px",
          }}
        >
          Status
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px 5px",
            borderRadius: "999px",
            border: `1px solid ${COLORS.gold}`,
            background: "rgba(227,191,114,0.12)",
            color: COLORS.cream,
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: COLORS.goldPale,
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          {copy}
        </div>
      </div>
    );
  };

  const renderRegistrationCard = () => (
    <div
      style={{
        ...CARD_STYLE,
        opacity: isConnected ? 1 : 0.72,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.goldMuted,
          marginBottom: "7px",
        }}
      >
        Registration
      </div>

      <div
        style={{
          color: COLORS.cream,
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        Unlock Real-World Access
      </div>

      <div
        style={{
          color: COLORS.goldSoft,
          fontSize: "12px",
          lineHeight: 1.6,
          marginBottom: "10px",
        }}
      >
        Complete registration to unlock lessons, bookings, event access, and
        fuller patron recognition tied to your wallet.
      </div>

      <button
        type="button"
        className="btn btn-outline"
        onClick={openRegistration}
        disabled={!isConnected}
        style={{
          minWidth: "auto",
          width: "100%",
          padding: "8px 14px",
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: isConnected ? 1 : 0.45,
          cursor: isConnected ? "pointer" : "not-allowed",
        }}
      >
        Complete Registration
      </button>

      {!isConnected && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            lineHeight: 1.4,
            color: COLORS.goldMuted,
            textAlign: "center",
          }}
        >
          Connect or create your Patron Wallet above to enable this step.
        </div>
      )}
    </div>
  );

  const renderCheckout = () => (
    <>
      <div style={{ position: "relative" }}>
        {!isConnected &&
          (closeOnDisabledOverlay && onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Connect wallet first"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(3, 17, 41, 0.74)",
                zIndex: 10,
                borderRadius: 12,
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(3, 17, 41, 0.74)",
                zIndex: 10,
                borderRadius: 12,
              }}
            />
          ))}

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
                color: COLORS.goldSoft,
                marginBottom: 6,
              }}
            >
              Monthly Care Contribution
            </label>

            <select
              value={selectedPackage}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedPackage(value);

                if (value !== "custom" && carePackages[value]) {
                  setUsdAmount(carePackages[value].amount);
                }
              }}
              style={{
                ...FIELD_STYLE,
                marginBottom: selectedPackage === "custom" ? 8 : 0,
              }}
            >
              <option value="4-rides">$500 — supports up to 4 rides</option>
              <option value="5-rides">$615 — supports up to 5 rides</option>
              <option value="6-rides">$720 — supports up to 6 rides</option>
              <option value="7-rides">$825 — supports up to 7 rides</option>
              <option value="8-rides">$920 — supports up to 8 rides</option>
              <option value="custom">Custom amount</option>
            </select>

            {selectedPackage === "custom" && (
              <input
                type="number"
                min="2"
                step="1"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                style={{
                  ...FIELD_STYLE,
                  fontSize: 16,
                }}
              />
            )}

            <div
              style={{
                marginTop: "7px",
                color: COLORS.goldMuted,
                fontSize: "11px",
                lineHeight: 1.45,
              }}
            >
              {currentPackage.description}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: COLORS.goldSoft,
                marginBottom: 6,
              }}
            >
              Intended Use
            </label>

            <select
              value={purchasePurpose}
              onChange={(e) => setPurchasePurpose(e.target.value)}
              style={FIELD_STYLE}
            >
              <option value="monthly-care">
                Monthly care contribution with ride access
              </option>

              <option value="horse-lease">Horse lease / ride credit</option>

              <option value="horse-welfare">
                Horse welfare support / donation
              </option>

              <option value="patron-support">General patron support</option>
            </select>
          </div>

          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              lineHeight: 1.45,
              color: COLORS.goldSoft,
              textAlign: "center",
            }}
          >
            {purchasePurpose === "horse-welfare"
              ? "Welfare support is recorded as general horse support and does not guarantee ride credits, bookings, or services."
              : "Ride access is subject to scheduling, horse availability, safety approval, and local chapter rules."}
          </p>

          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              lineHeight: 1.45,
              color: COLORS.goldSoft,
              textAlign: "center",
            }}
          >
            PATRON tokens are automatically credited to your wallet after
            payment.
          </p>

          <div
            className="checkout-wrapper"
            style={{
              borderRadius: "14px",
              overflow: "hidden",
              background: COLORS.panelRaised,
            }}
          >
            <CheckoutBoundary>
              <CheckoutWidget
                client={client}
                name="BUY POLO PATRONIUM (PATRON)"
                description="USPPA Patronage Token — supporting the PPA PoloBred StringPool, horse welfare, founding patron initiatives, and related association programs."
                currency="USD"
                chain={BASE}
                amount={normalizedAmount}
                tokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                seller="0xfee3c75691e8c10ed4246b10635b19bfff06ce16"
                buttonLabel="BUY PATRON (USDC on Base)"
                theme={patronCheckoutTheme}
                purchaseData={{
                  walletAddress: account?.address,
                  usdAmount: normalizedAmount,
                  selectedPackage,
                  selectedPackageLabel: currentPackage.label,
                  purchasePurpose,
                }}
                onSuccess={handleCheckoutSuccess}
                onError={handleCheckoutError}
              />
            </CheckoutBoundary>
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: "10px",
          fontSize: "11px",
          lineHeight: 1.5,
          color: COLORS.goldSoft,
          textAlign: "center",
        }}
      >
        This Patron Wallet works across{" "}
        <a
          href="https://uspolopatrons.org"
          target="_blank"
          rel="noreferrer"
          style={{
            color: COLORS.gold,
            textDecoration: "none",
          }}
        >
          USPoloPatrons.org
        </a>{" "}
        and{" "}
        <a
          href="https://polopatronium.com"
          target="_blank"
          rel="noreferrer"
          style={{
            color: COLORS.gold,
            textDecoration: "none",
          }}
        >
          PoloPatronium.com
        </a>
        .
      </p>
    </>
  );

  const renderSyndicateCards = () => (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {[
        {
          title: "PPA PoloBred StringPool",
          copy:
            "Support horse intake, seasoning, welfare, and long-term string development across the association.",
          kicker: "Association Horse Pool",
        },
        {
          title: "Founding Horse Syndicate",
          copy:
            "Direct additional patronage toward the first prospect horses and their acquisition, care, and development.",
          kicker: "First Live Offer",
        },
        {
          title: "PoloBred Prospect Pathway",
          copy:
            "Help place horses, players, and training miles into a structured pathway from lessons and tryouts into live chukkers.",
          kicker: "Player + Horse Ladder",
        },
      ].map((item) => (
        <div
          key={item.title}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: `1px solid ${COLORS.borderSoft}`,
            background:
              "linear-gradient(180deg, rgba(16,43,78,0.84), rgba(8,28,59,0.94))",
            boxShadow: "0 10px 24px rgba(1, 7, 20, 0.2)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.goldMuted,
              marginBottom: "7px",
            }}
          >
            {item.kicker}
          </div>

          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.cream,
              marginBottom: "8px",
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              color: COLORS.goldSoft,
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            {item.copy}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMvpDashboard = () => (
    <div>
      {renderConnectOrAccount()}
      {renderStatusCard()}

      <div style={CARD_STYLE}>
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.goldSoft,
            marginBottom: "8px",
          }}
        >
          Patron Dashboard
        </div>

        <div
          style={{
            color: COLORS.cream,
            fontSize: "13px",
            lineHeight: 1.75,
          }}
        >
          <div>
            <strong>Role:</strong> {isConnected ? "Holder Member" : "Guest"}
          </div>

          <div>
            <strong>Wallet:</strong> {shortAddress || "Not connected"}
          </div>

          <div>
            <strong>Token Use:</strong>{" "}
            {isConnected
              ? "Buy PATRON and support initiatives now"
              : "Connect to begin"}
          </div>

          <div>
            <strong>Recognition:</strong>{" "}
            {isConnected ? "Anonymous until registered" : "Unavailable"}
          </div>
        </div>
      </div>

      <div style={CARD_STYLE}>
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.goldSoft,
            marginBottom: "10px",
          }}
        >
          Founding Syndicate Presentation
        </div>

        {renderSyndicateCards()}
      </div>

      <div style={CARD_STYLE}>
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.goldSoft,
            marginBottom: "10px",
          }}
        >
          Wallet &amp; Token Sale
        </div>

        {renderCheckout()}
      </div>

      {renderRegistrationCard()}
    </div>
  );

  const renderRegistrationModal = () => {
    if (!isRegistrationOpen) return null;

    return (
      <div
        className="wallet-modal-backdrop"
        onClick={closeRegistration}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(3, 17, 41, 0.92)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          padding: "14px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "14px",
              padding: "18px 16px 16px",
              background:
                "linear-gradient(180deg, #0b2342 0%, #071936 58%, #06152c 100%)",
              boxShadow: "0 18px 60px rgba(1, 7, 20, 0.82)",
              fontFamily:
                '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
              color: COLORS.cream,
              fontSize: "13px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                paddingTop: "2px",
              }}
            >
              {renderOrgLogo()}

              <div
                style={{
                  textAlign: "center",
                  fontSize: "15px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: COLORS.cream,
                  marginTop: "-4px",
                  marginBottom: "10px",
                }}
              >
                Complete Registration
              </div>

              <button
                type="button"
                onClick={closeRegistration}
                aria-label="Close registration"
                title="Close"
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  width: "48px",
                  height: "48px",
                  border: "none",
                  background: "transparent",
                  color: COLORS.gold,
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
                color: COLORS.goldPale,
                textAlign: "center",
              }}
            >
              Complete registration to unlock lessons, bookings, event access,
              and fuller patron recognition linked to your Patron Wallet.
            </p>

            {registrationSubmitStatus === "success" ? (
              <div
                style={{
                  padding: "14px 10px 10px",
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.borderBright}`,
                  background:
                    "radial-gradient(circle at top, rgba(227,191,114,0.15), rgba(11,35,66,0.97) 50%, rgba(7,25,54,0.99) 100%)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "34px",
                    lineHeight: 1,
                    marginBottom: "6px",
                  }}
                >
                  ✓
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: COLORS.gold,
                    marginBottom: "8px",
                  }}
                >
                  Registration Received
                </div>

                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "12px",
                    lineHeight: 1.7,
                    color: COLORS.cream,
                  }}
                >
                  Thank you — your registration was received.
                  <br />
                  We&apos;ll email you with access and next-step details.
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={closeRegistration}
                  style={{
                    marginTop: "6px",
                    padding: "8px 22px",
                    fontSize: "11px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <form
                  name="circuit-signup"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  onSubmit={handleRegistrationSubmit}
                >
                  <input
                    type="hidden"
                    name="form-name"
                    value="circuit-signup"
                  />

                  <p style={{ display: "none" }}>
                    <label>
                      Don’t fill this out if you're human:
                      <input name="bot-field" />
                    </label>
                  </p>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-name-wallet"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Name
                    </label>

                    <input
                      id="cs-name-wallet"
                      name="name"
                      type="text"
                      required
                      style={FORM_FIELD_STYLE}
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-email-wallet"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Email
                    </label>

                    <input
                      id="cs-email-wallet"
                      name="email"
                      type="email"
                      required
                      style={FORM_FIELD_STYLE}
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Interested In{" "}
                      <span
                        style={{
                          fontSize: "9px",
                          opacity: 0.8,
                        }}
                      >
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
                        "Patron",
                        "Lessons / Bookings",
                        "Tickets / Events",
                        "Rider",
                        "Parent / Guardian",
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
                              accentColor: COLORS.gold,
                            }}
                          />

                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-chapter-wallet"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Chapter / City / Arena
                    </label>

                    <input
                      id="cs-chapter-wallet"
                      name="chapter"
                      type="text"
                      placeholder="Charleston, SC · Creek Plantation, etc."
                      style={FORM_FIELD_STYLE}
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-notes-wallet"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Notes
                    </label>

                    <textarea
                      id="cs-notes-wallet"
                      name="notes"
                      rows={3}
                      placeholder="Tell us about your goals, horses, or interests."
                      style={{
                        ...FORM_FIELD_STYLE,
                        resize: "vertical",
                        minHeight: "80px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-wallet-wallet"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: COLORS.goldSoft,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Linked Wallet
                    </label>

                    <input
                      id="cs-wallet-wallet"
                      type="text"
                      value={account?.address || ""}
                      readOnly
                      style={{
                        ...FORM_FIELD_STYLE,
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
                        color: COLORS.goldMuted,
                      }}
                    >
                      This links your access profile to your Patron Wallet.
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
                        opacity:
                          registrationSubmitStatus === "submitting" ? 0.7 : 1,
                        cursor:
                          registrationSubmitStatus === "submitting"
                            ? "wait"
                            : "pointer",
                      }}
                      disabled={registrationSubmitStatus === "submitting"}
                    >
                      {registrationSubmitStatus === "submitting"
                        ? "Submitting…"
                        : "Complete Registration"}
                    </button>
                  </div>
                </form>

                {registrationSubmitStatus === "error" && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: COLORS.danger,
                      textAlign: "center",
                    }}
                  >
                    Something went wrong submitting the form. Please try again.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showDashboardTabs) {
    return (
      <>
        {renderWalletHeader()}
        {renderMvpDashboard()}
        {renderRegistrationModal()}
      </>
    );
  }

  return (
    <>
      {renderWalletHeader()}
      {renderConnectOrAccount()}
      {renderRegistrationCard()}
      {renderCheckout()}
      {renderRegistrationModal()}
    </>
  );
}