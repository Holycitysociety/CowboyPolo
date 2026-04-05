import React, { useState } from "react";
import { ConnectEmbed, CheckoutWidget } from "thirdweb/react";

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
  const [isCircuitModalOpen, setIsCircuitModalOpen] = useState(false);
  const [circuitSubmitStatus, setCircuitSubmitStatus] = useState("idle");

  const openCircuitSignup = () => {
    if (!isConnected) return;
    setCircuitSubmitStatus("idle");
    setIsCircuitModalOpen(true);
  };

  const closeCircuitSignup = () => {
    setIsCircuitModalOpen(false);
    setCircuitSubmitStatus("idle");
  };

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

  const renderWalletHeader = () => (
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

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
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
            color: "#dec89a",
          }}
        >
          Sign up with your email to create your Cowboy Polo Patron Wallet. This
          same wallet works on{" "}
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
                {baseBalance?.displayValue || "0"} {baseBalance?.symbol || "ETH"}
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
    </>
  );

  const renderStatusBadge = () => {
    let label = "Guest";
    let copy = "Sign in to buy PATRON, support initiatives, and begin your patron profile.";

    if (isConnected) {
      label = "Anonymous Holder";
      copy =
        "You can buy PATRON and support initiatives now. Complete registration to unlock lessons, bookings, tickets, recognition, and fuller dashboard access.";
    }

    return (
      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid rgba(227,191,114,0.28)",
          background:
            "radial-gradient(circle at top, rgba(227,191,114,0.08), rgba(5,5,5,0.94))",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#c7b08a",
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
            border: "1px solid #e3bf72",
            background: "rgba(227,191,114,0.12)",
            color: "#f5eedc",
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
            color: "#dec89a",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          {copy}
        </div>
      </div>
    );
  };

  const renderUnlockCard = ({ title, copy, buttonText = "Complete Registration" }) => (
    <div
      style={{
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid rgba(227,191,114,0.18)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08)), #0a0a0a",
        opacity: isConnected ? 1 : 0.72,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#9f8a64",
          marginBottom: "7px",
        }}
      >
        Unlock Access
      </div>
      <div
        style={{
          color: "#f5eedc",
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: "#c7b08a",
          fontSize: "12px",
          lineHeight: 1.6,
          marginBottom: "10px",
        }}
      >
        {copy}
      </div>
      <button
        type="button"
        className="btn btn-outline"
        onClick={openCircuitSignup}
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
        {buttonText}
      </button>
    </div>
  );

  const renderNextSteps = () => (
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
        Complete Registration
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
                background: "rgba(0,0,0,0.68)",
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
                background: "rgba(0,0,0,0.68)",
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
                color: "#c7b08a",
                marginBottom: 6,
              }}
            >
              Choose Your Patronage (USD)
            </label>
            <input
              type="number"
              min="2"
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

          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              lineHeight: 1.45,
              color: "#c7b08a",
              textAlign: "center",
            }}
          >
            PATRON tokens are automatically credited to your wallet after
            payment.
          </p>

          <CheckoutBoundary>
            <CheckoutWidget
              client={client}
              name={"BUY POLO PATRONIUM (PATRON)"}
              description={
                "USPPA Patronage Token — supporting Three Sevens Remuda, Cowboy Polo Circuit, The Polo Way streaming, and Charleston Polo."
              }
              currency={"USD"}
              chain={BASE}
              amount={normalizedAmount}
              tokenAddress={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}
              seller={"0xfee3c75691e8c10ed4246b10635b19bfff06ce16"}
              buttonLabel={"BUY PATRON (USDC on Base)"}
              theme={patronCheckoutTheme}
              purchaseData={{ walletAddress: account?.address }}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
            />
          </CheckoutBoundary>
        </div>
      </div>

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
    </>
  );

  const renderPatronDashboard = () => (
    <div>
      {renderConnectOrAccount()}
      {renderStatusBadge()}

      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #3a2b16",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#c7b08a",
            marginBottom: "8px",
          }}
        >
          Patron Dashboard
        </div>
        <div style={{ color: "#f5eedc", fontSize: "13px", lineHeight: 1.75 }}>
          <div>
            <strong>Role:</strong> {isConnected ? "Holder Member" : "Guest"}
          </div>
          <div>
            <strong>Wallet:</strong> {shortAddress || "Not connected"}
          </div>
          <div>
            <strong>Access:</strong>{" "}
            {isConnected ? "Buy PATRON and support initiatives now" : "Connect to begin"}
          </div>
          <div>
            <strong>Recognition:</strong>{" "}
            {isConnected ? "Anonymous until registered" : "Unavailable"}
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #3a2b16",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#c7b08a",
            marginBottom: "10px",
          }}
        >
          Live Initiatives
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {[
            {
              title: "Three Sevens Remuda",
              copy:
                "Support horse intake, development, and prospect growth across the association remuda.",
            },
            {
              title: "Cowboy Polo Circuit",
              copy:
                "Support clinics, chukkers, and the expanding rider pipeline across local chapters.",
            },
            {
              title: "Founding Horse Syndicate",
              copy:
                "Direct additional patronage toward the first remuda syndicate horse and related care.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(227,191,114,0.18)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#f5eedc",
                  marginBottom: "8px",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  color: "#c7b08a",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {item.copy}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #3a2b16",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#c7b08a",
            marginBottom: "10px",
          }}
        >
          Wallet & Patronage
        </div>
        {renderCheckout()}
      </div>

      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #3a2b16",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#c7b08a",
            marginBottom: "10px",
          }}
        >
          Unlock More
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {renderUnlockCard({
            title: "Lessons & Bookings",
            copy:
              "Complete registration to book lessons, polo experiences, and real-world rider access.",
          })}
          {renderUnlockCard({
            title: "Tickets & Event Access",
            copy:
              "Complete registration to reserve event access, future ticketing, and chapter invitations.",
          })}
          {renderUnlockCard({
            title: "Patron Recognition",
            copy:
              "Complete registration to attach your name, profile, and chapter identity to your support.",
          })}
          {renderUnlockCard({
            title: "Player Pathway",
            copy:
              "Register as rider, parent, or guardian to unlock player progress, chapter tools, and more.",
          })}
        </div>
      </div>

      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #3a2b16",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#c7b08a",
            marginBottom: "10px",
          }}
        >
          Remuda Snapshot
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {[
            {
              name: "River Scout",
              units: 2,
              status: "Training",
            },
            {
              name: "Thunderbird",
              units: 1,
              status: "Active",
            },
            {
              name: "Sundance",
              units: 3,
              status: "Patron Pool",
            },
          ].map((horse) => (
            <div
              key={horse.name}
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(227,191,114,0.18)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#f5eedc",
                  marginBottom: "8px",
                }}
              >
                {horse.name}
              </div>
              <div style={{ color: "#c7b08a", fontSize: "12px", lineHeight: 1.7 }}>
                <div>Patron Units: {horse.units}</div>
                <div>Status: {horse.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderNextSteps()}
    </div>
  );

  const renderSignupModal = () => {
    if (!isCircuitModalOpen) return null;

    return (
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
                  Complete Registration
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
              Complete registration to unlock lessons, bookings, event access,
              fuller patron recognition, and player pathway tools linked to your
              Patron Wallet.
            </p>

            {circuitSubmitStatus === "success" ? (
              <div
                style={{
                  padding: "14px 10px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(234,191,114,0.4)",
                  background:
                    "radial-gradient(circle at top, rgba(227,191,114,0.16), rgba(0,0,0,0.95))",
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
                    color: "#e3bf72",
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
                    color: "#f5eedc",
                  }}
                >
                  Thank you — your registration was received.
                  <br />
                  We&apos;ll email you with chapter, season, and access details
                  as they open.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={closeCircuitSignup}
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
                  onSubmit={handleCircuitSubmit}
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
                        color: "#c7b08a",
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
                      htmlFor="cs-email-wallet"
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
                      id="cs-email-wallet"
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
                        "Tickets / Events",
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
                      htmlFor="cs-chapter-wallet"
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
                      id="cs-chapter-wallet"
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
                      htmlFor="cs-notes-wallet"
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
                      id="cs-notes-wallet"
                      name="notes"
                      rows={3}
                      placeholder="Tell us about your goals, horses, or program."
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

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="cs-wallet-wallet"
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
                      id="cs-wallet-wallet"
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
                      This links your access profile to your Patron Wallet.
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
                        opacity:
                          circuitSubmitStatus === "submitting" ? 0.7 : 1,
                        cursor:
                          circuitSubmitStatus === "submitting"
                            ? "wait"
                            : "pointer",
                      }}
                      disabled={circuitSubmitStatus === "submitting"}
                    >
                      {circuitSubmitStatus === "submitting"
                        ? "Submitting…"
                        : "Complete Registration"}
                    </button>
                  </div>
                </form>

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
        {renderPatronDashboard()}
        {renderSignupModal()}
      </>
    );
  }

  return (
    <>
      {renderWalletHeader()}
      {renderConnectOrAccount()}
      {renderNextSteps()}
      {renderCheckout()}
      {renderSignupModal()}
    </>
  );
}