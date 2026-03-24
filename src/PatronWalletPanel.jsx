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
  openCircuitSignup,
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
  const [activeTab, setActiveTab] = useState("home");

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
            style={tabButtonStyle("home")}
            onClick={() => setActiveTab("home")}
          >
            Home
          </button>
          <button
            type="button"
            style={tabButtonStyle("stable")}
            onClick={() => setActiveTab("stable")}
          >
            Stable
          </button>
          <button
            type="button"
            style={tabButtonStyle("wallet")}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
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
                Player Profile
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
                Handicap Progress
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "8px",
                  height: "90px",
                  padding: "8px 0 4px",
                }}
              >
                {[20, 32, 45, 62, 80].map((height, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "28px",
                        height: `${height}px`,
                        borderRadius: "999px",
                        background: "linear-gradient(to top, #8f6b2f, #e3bf72)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#9f8a64",
                      }}
                    >
                      {[0.0, 0.2, 0.4, 0.7, 1.0][index]}
                    </div>
                  </div>
                ))}
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
      </>
    );
  }

  return (
    <>
      {renderWalletHeader()}
      {renderConnectOrAccount()}
      {renderNextSteps()}
      {renderCheckout()}
    </>
  );
}