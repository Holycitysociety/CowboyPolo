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
  const [activeTab, setActiveTab] = useState("wallet");
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
                {usdcBalance?.displayValue || "0"} {usdcBalance?.symbol || "USDC"}
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
              This form links your Cowboy Polo interest to your Patron Wallet so
              we can connect riders, parents, and arenas with the right chapters
              and rewards.
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
                  You&apos;re signed up
                </div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "12px",
                    lineHeight: 1.7,
                    color: "#f5eedc",
                  }}
                >
                  Thank you — your Cowboy Polo Circuit signup was received.
                  <br />
                  We&apos;ll email you with local chapter and season details as
                  they open.
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
                      This links your Circuit interest to your Patron Wallet
                      profile.
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
                        : "Submit Circuit Signup"}
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

  const renderDashboardTabs = () => {
    const tabButtonStyle = (tab) => ({
      flex: 1,
      padding: "10px 8px",
      borderRadius: "999px",
      border: activeTab === tab ? "1px solid #e3bf72" : "1px solid #3a2b16",
      background: activeTab === tab ? "#e3bf72" : "#050505",
      color: activeTab === tab ? "#181210" : "#f5eedc",
      fontSize: "10px",
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      cursor: "pointer",
      fontFamily:
        '"Cinzel", "EB Garamond", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", serif',
    });

    const chartHeight = 180;
    const chartBottomPad = 22;
    const chartUsableHeight = chartHeight - chartBottomPad;
    const ticks = [10, 8, 6, 4, 2, 0];
    const bars = [
      { label: "D4", value: 8 },
      { label: "D3", value: 6 },
      { label: "D2", value: 4 },
      { label: "D1 / G", value: 2 },
    ];

    const getY = (value) => (10 - value) * (chartUsableHeight / 10);
    const getBarHeight = (value) => (value / 10) * chartUsableHeight;

    return (
      <>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            style={tabButtonStyle("wallet")}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
          </button>
          <button
            type="button"
            style={tabButtonStyle("stable")}
            onClick={() => setActiveTab("stable")}
          >
            7̶7̶7̶ REMUDA
          </button>
          <button
            type="button"
            style={tabButtonStyle("home")}
            onClick={() => setActiveTab("home")}
          >
            Handicap
          </button>
        </div>

        {activeTab === "home" && (
          <div>
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
                Player Profile Preview
              </div>
              <div style={{ color: "#f5eedc", fontSize: "13px", lineHeight: 1.8 }}>
                <div>
                  <strong>Name:</strong> {account ? "Patron / Player" : "Guest"}
                </div>
                <div>
                  <strong>Wallet:</strong> {shortAddress || "Not connected"}
                </div>
                <div>
                  <strong>Chapter:</strong> Charleston Polo
                </div>
                <div>
                  <strong>Division:</strong> Division 4
                </div>
                <div>
                  <strong>Global Handicap:</strong> 0.7
                </div>
                <div>
                  <strong>Next Goal:</strong> Reach 1.0
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
                Handicap Per Division
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr",
                  columnGap: "10px",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: `${chartHeight}px`,
                    paddingBottom: `${chartBottomPad}px`,
                  }}
                >
                  {ticks.map((tick) => (
                    <div
                      key={tick}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: `${getY(tick)}px`,
                        transform: "translateY(-50%)",
                        fontSize: "10px",
                        color: "#9f8a64",
                        lineHeight: 1,
                        textAlign: "right",
                      }}
                    >
                      {tick}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    position: "relative",
                    height: `${chartHeight}px`,
                    paddingBottom: `${chartBottomPad}px`,
                    borderLeft: "1px solid rgba(199,176,138,0.2)",
                    borderBottom: "1px solid rgba(199,176,138,0.2)",
                  }}
                >
                  {ticks.map((tick) => (
                    <div
                      key={tick}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${getY(tick)}px`,
                        borderTop: "1px solid rgba(199,176,138,0.16)",
                      }}
                    />
                  ))}

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "0 0 0 10px",
                    }}
                  >
                    {bars.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          height: "100%",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "8px",
                            fontSize: "12px",
                            color: "#f5eedc",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {item.value}
                        </div>

                        <div
                          style={{
                            width: "100%",
                            maxWidth: "36px",
                            height: `${getBarHeight(item.value)}px`,
                            borderRadius: "10px 10px 0 0",
                            background: "linear-gradient(to top, #8f6b2f, #e3bf72)",
                            boxShadow: "0 4px 14px rgba(227,191,114,0.18)",
                          }}
                        />

                        <div
                          style={{
                            marginTop: "8px",
                            height: `${chartBottomPad - 4}px`,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "center",
                            fontSize: "11px",
                            color: "#c7b08a",
                            textAlign: "center",
                            lineHeight: 1.2,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {renderNextSteps()}
          </div>
        )}

        {activeTab === "stable" && (
          <div>
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
                    border: "1px solid #3a2b16",
                    background: "#0a0a0a",
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
        )}

        {activeTab === "wallet" && (
          <div>
            {renderConnectOrAccount()}
            {renderNextSteps()}
            {renderCheckout()}
          </div>
        )}
      </>
    );
  };

  if (showDashboardTabs) {
    return (
      <>
        {renderWalletHeader()}
        {renderDashboardTabs()}
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