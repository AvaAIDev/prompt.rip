import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { FaWallet, FaCheckCircle, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { usePrivyWallet } from "../hooks/usePrivyWallet";
import { usePrivyWalletContext } from "../context/PrivyWalletContext";

const truncateAddress = (address) => {
  if (!address) return "No wallet connected";
  return address.slice(0, 4) + "..." + address.slice(-4);
};

const Privy = () => {
  const { login, logout, ready, authenticated } = usePrivy();
  const {
    privyWallet,
    balance,
    loading: balanceLoading,
    error: balanceError,
  } = usePrivyWalletContext();
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    if (privyWallet?.address) {
      await navigator.clipboard.writeText(privyWallet.address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    }
  };

  return (
    <>
      {showCopied && (
        <div
          style={{
            position: "fixed",
            top: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, #222 0%, #444 100%)",
            color: "#fff",
            padding: "0.7rem 1.6rem",
            borderRadius: "1.5rem",
            fontSize: "1.05rem",
            zIndex: 9999,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            border: "1.5px solid #3ad29f",
            animation: "fadeInOut 1.5s",
          }}
        >
          <FaCheckCircle style={{ color: "#3ad29f", fontSize: "1.3rem" }} />
          Address copied!
        </div>
      )}

      <div
        className="wallet-section"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginTop: "1rem",
          marginBottom: "1rem",
        }}
      >
        {!authenticated ? (
          <button
            onClick={() =>
              login({
                loginMethods: ["wallet"],
                walletChainType: "solana-only",
                disableSignup: false,
              })
            }
            disabled={!ready}
            style={{
              padding: "0.5rem 1.2rem",
              borderRadius: "20px",
              border: "none",
              background: "#222",
              color: "#fff",
              fontWeight: 600,
              cursor: ready ? "pointer" : "not-allowed",
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "background 0.2s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <FaWallet style={{ marginRight: 8, verticalAlign: "middle" }} />
              Login
            </span>
          </button>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#181818",
                color: "#fff",
                borderRadius: "16px",
                padding: "0.4rem 1rem",
                fontSize: "1rem",
                fontWeight: 500,
                gap: "0.1rem",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: privyWallet?.address ? "pointer" : "default",
                  userSelect: "all",
                }}
                onClick={privyWallet?.address ? handleCopy : undefined}
                title={privyWallet?.address ? "Click to copy address" : ""}
              >
                <FaWallet style={{ marginRight: 8, verticalAlign: "middle" }} />
                {privyWallet?.address
                  ? truncateAddress(privyWallet.address)
                  : authenticated
                  ? "Loading..."
                  : "No wallet connected"}
              </span>
              {privyWallet?.address && (
                <span
                  style={{
                    fontSize: "0.95rem",
                    color: "#aaa",
                  }}
                >
                  {balanceLoading
                    ? "Fetching balance..."
                    : balanceError
                    ? "Error fetching balance"
                    : balance
                    ? `Balance: ${balance?.toFixed(2)} SOL`
                    : ""}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              style={{
                padding: "0.4rem 1.1rem",
                borderRadius: "16px",
                border: "none",
                background: "#e74c3c",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "1rem",
                marginLeft: "0.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
              }}
            >
              Logout
            </button>
          </>
        )}
        <div className="social-links desktop-only">
          <a
            href="https://x.com/auo1i"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaXTwitter size={20} color="#ffffff" />
          </a>
          <a
            href="https://github.com/auo1i/prompt.rip"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaGithub size={20} color="#ffffff" />
          </a>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px);}
            10% { opacity: 1; transform: translateX(-50%) translateY(0);}
            90% { opacity: 1; transform: translateX(-50%) translateY(0);}
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px);}
          }
        `}
      </style>
    </>
  );
};

export default Privy;
