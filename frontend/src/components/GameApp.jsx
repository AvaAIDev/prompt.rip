import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Connection, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useParams } from "react-router-dom";
import {
  FaSkull,
  FaSadCry,
  FaCrosshairs,
  FaBomb,
  FaSkullCrossbones,
  FaTwitter,
  FaGithub,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { GiDrippingBlade, GiCrossedSwords } from "react-icons/gi";
import { RiSwordFill } from "react-icons/ri";
import { Buffer } from "buffer";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWalletContext } from "../context/PrivyWalletContext";
import { usePrivyWallet } from "../hooks/usePrivyWallet";
import {
  useSendTransaction,
  useSignTransaction,
} from "@privy-io/react-auth/solana";
// Game components
import GameLoadingScreen from "./GameLoadingScreen";
import GameHealthBar from "./GameHealthBar";
import GameTypingBubble from "./GameTypingBubble";
import AIAvatar from "./AIAvatar";
import ErrorModal from "./templates/ErrorModal";
import UserAvatar from "./UserAvatar";
import { AIAvatar as ChatAIAvatar } from "./AIAvatar";
import Header from "./Header";

// Styles
import "../styles/GameTheme.css";
import logo from "../assets/logo.png";

const mode = import.meta.env.VITE_MODE;
const DEVNET_RPC = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL;
const MAINNET_RPC = import.meta.env.VITE_SOLANA_MAINNET_RPC_URL;

const SOLANA_RPC = mode === "development" ? DEVNET_RPC : MAINNET_RPC;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureNewlines = (content) => {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
};

const GameApp = () => {
  const name = "prompt.rip";

  // Game state
  const [gameState, setGameState] = useState("loading"); // "loading", "playing", "win"
  const [status, setStatus] = useState("");
  const [aiHealth, setAiHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [damagePerHit, setDamagePerHit] = useState(10);
  const [criticalHitChance, setCriticalHitChance] = useState(0.2);
  const [damageDone, setDamageDone] = useState(0);
  const [showKillAnimation, setShowKillAnimation] = useState(false);

  // App state
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [challenge, setChallenge] = useState({});
  const [prompt, setPrompt] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [writing, setWriting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [price, setPrice] = useState(0);
  const [prize, setPrize] = useState(0);
  const [usdPrice, setUsdPrice] = useState(0);
  const [usdPrize, setUsdPrize] = useState(0);
  const [expiry, setExpiry] = useState(null);
  const [solPrice, setSolPrice] = useState(0);
  const [errorModalOpen, setErrorModalOpen] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const writingRef = useRef(writing);
  const isUploading = useRef(false);
  const previousWalletRef = useRef(null);

  // Wallet integration
  const { setVisible } = useWalletModal();

  // Privy integration
  const { authenticated, login, logout, ready, modalState, hideModal } =
    usePrivy();
  const { privyWallet, walletAddress } = usePrivyWalletContext();

  const { sendTransaction } = useSendTransaction();
  const { signTransaction } = useSignTransaction();

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    writingRef.current = writing;
  }, [writing]);

  useEffect(() => {
    if (writing) {
      scrollToBottom();
    }
  }, [conversation]);

  useEffect(() => {
    const previousWallet = previousWalletRef.current;
    const currentWallet = walletAddress;

    if (currentWallet) {
      // If previous wallet exists and is different from current, or wallet was disconnected
      if (
        (previousWallet && previousWallet !== currentWallet) ||
        !authenticated
      ) {
        localStorage.removeItem("token");
      }

      localStorage.setItem("address", currentWallet);
      previousWalletRef.current = currentWallet;
    } else if (!authenticated && previousWallet) {
      // Handle disconnection
      localStorage.removeItem("token");
      localStorage.removeItem("address");
      previousWalletRef.current = null;
    }
  }, [walletAddress, authenticated]);

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      // Simulate loading screen
      await delay(4000);

      // Go directly to playing without intro screen
      getChallenge(false);
      setGameState("playing");
    };

    initGame();
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      // Start challenge data fetching
      getChallenge(false);
      const interval = setInterval(() => {
        if (!writingRef.current) {
          getChallenge(true);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [gameState, name]);

  // Handle winning state
  useEffect(() => {
    if (aiHealth <= 0 && gameState === "playing") {
      handleAiDefeated();
    }
  }, [aiHealth, gameState]);

  // Stream AI response
  async function read(reader) {
    setWriting(true);
    const { done, value } = await reader.read();
    if (done) {
      console.log("Stream completed");
      setWriting(false);
      return;
    }
    const chunk = new TextDecoder("utf-8").decode(value);

    setConversation((prevMessages) => {
      setLoading(false);
      let messagesCopy = [...prevMessages];
      const lastMessage = messagesCopy[messagesCopy.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        messagesCopy[messagesCopy.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + chunk,
          date: new Date().toISOString(),
        };
      } else {
        messagesCopy = [
          ...messagesCopy,
          {
            role: "assistant",
            content: chunk,
            date: new Date().toISOString(),
          },
        ];
      }
      return messagesCopy;
    });

    await delay(20);
    return read(reader);
  }

  const handleAiDefeated = async () => {
    setShowKillAnimation(true);
    await delay(1500);
    setGameState("win");
  };

  const handleAttack = () => {
    // Calculate damage with chance for critical hit
    const isCritical = Math.random() < criticalHitChance;
    const damage = isCritical ? damagePerHit * 2 : damagePerHit;

    // Apply damage to AI health
    const newHealth = Math.max(0, aiHealth - damage);
    setAiHealth(newHealth);
    setDamageDone(damage);

    // Add blood effects
    const bloodHits = document.querySelector(".game-chat-container");
    if (bloodHits) {
      for (let i = 0; i < 3; i++) {
        const blood = document.createElement("div");
        blood.className = "blood-drop";
        blood.style.left = `${Math.random() * 90 + 5}%`;
        blood.style.top = `${Math.random() * 50 + 25}%`;
        bloodHits.appendChild(blood);

        setTimeout(() => {
          if (blood.parentNode) {
            blood.parentNode.removeChild(blood);
          }
        }, 2000);
      }
    }
  };

  const getChallenge = async (noLoading) => {
    if (isUploading.current) {
      return;
    }

    if (!noLoading) {
      setPageLoading(true);
    }

    try {
      // Use demo endpoint if not connected to wallet, otherwise use main endpoint
      const endpoint = `/api/challenges/get-challenge?name=${name}&initial=${!noLoading}&price=${price}`;

      const data = await axios
        .get(endpoint)
        .then((res) => res.data)
        .catch((err) => err);

      setError(null);

      // Always update these values when data is fetched
      setChallenge(data.challenge);
      setStatus(data.challenge?.status || ""); // Set status to challenge.status

      // Always update health from challenge
      setAiHealth(
        data.challenge?.health !== undefined ? data.challenge.health : 100
      );
      setMaxHealth(100); // Always use 100 as max

      // Always update stats
      setAttempts(data.break_attempts || 0);
      setPrice(data.message_price || 0);
      setPrize(data.prize || 0);
      setUsdPrice(data.usdMessagePrice || 0);
      setUsdPrize(data.usdPrize || 0);
      setExpiry(data.expiry || null);
      setSolPrice(data.solPrice || 0);

      // Only skip updating the conversation if currently writing
      if (!writing) {
        if (!noLoading) {
          console.log("Updated initial conversation");
          setConversation([
            {
              role: "assistant",
              content:
                "I am the AI Guardian. Your mission is to defeat me with your prompts. Each successful attack will drain my health. Can you bring me down before I stop you?",
              date: new Date().toISOString(),
            },
            ...(data.chatHistory || []),
          ]);

          // Scroll to bottom after loading initial conversation
          setTimeout(scrollToBottom, 100);
        } else {
          // Always update conversation with latest messages regardless of wallet state
          console.log("Refreshing conversation with latest messages");
          setConversation(data.chatHistory || []);

          // Scroll to bottom after updating conversation
          setTimeout(scrollToBottom, 100);
        }
      }

      setPageLoading(false);
    } catch (err) {
      console.error(err);
      setPageLoading(false);
      setErrorModalOpen("Failed to fetch challenge");
    }
  };

  const createAuthenticatedRequest = async (endpoint, headers, body) => {
    // Add wallet address check before trying stored token
    const storedAddress = localStorage.getItem("address");
    const storedToken = localStorage.getItem("token");

    // If wallet isn't connected, fail immediately
    if (!authenticated || !walletAddress) {
      throw new Error("Wallet not connected");
    }

    // Clear token if addresses don't match
    if (storedAddress !== walletAddress) {
      console.log("Wallet address changed, clearing token");
      localStorage.removeItem("token");
      localStorage.setItem("address", walletAddress);
    }

    // Only try token auth if we have a token
    if (storedToken && storedAddress === walletAddress) {
      try {
        const verifyResponse = await axios.get("/api/auth/verify-token", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            address: walletAddress, // Always include current address
          },
        });

        if (verifyResponse.status === 200 && verifyResponse.data.valid) {
          // Token is valid and matches current wallet
          headers.Authorization = `Bearer ${storedToken}`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
          });
          return response;
        } else {
          // Token is invalid or doesn't match wallet - force re-auth
          console.log("Token verification failed", verifyResponse.data);
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem("token");
      }
    }

    // If we reach here, token auth failed - use wallet signature
    try {
      console.log("Using wallet signature authentication for", walletAddress);
      const message = `Authenticate with your wallet: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await privyWallet.signMessage(encodedMessage);

      headers["Content-Type"] = "application/json";
      headers["signature"] = bs58.encode(signature);
      headers["publickey"] = walletAddress;
      headers["message"] = message;
      headers["timestamp"] = Date.now().toString();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      return response;
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorModalOpen(error.message || "Authentication failed");
      throw error;
    }
  };

  const getTransaction = async () => {
    try {
      // Explicitly check and clear token if wallet address mismatch before transaction
      const storedAddress = localStorage.getItem("address");
      const storedToken = localStorage.getItem("token");

      // Force token reset if addresses don't match (prevent auth issues)
      if (!walletAddress || storedAddress !== walletAddress) {
        console.log(
          "Wallet address mismatch before transaction, clearing token"
        );
        localStorage.removeItem("token");
        localStorage.setItem("address", walletAddress || "");
      }

      // Create a connection with proper commitment level
      const connection = new Connection(SOLANA_RPC, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000, // 60 seconds timeout
      });

      // Set up headers
      const headers = {
        "Content-Type": "application/json",
      };

      // Request transaction from backend
      const response = await createAuthenticatedRequest(
        "/api/transactions/get-transaction",
        headers,
        {
          solution: prompt,
          userWalletAddress: walletAddress,
          id: challenge._id,
        }
      );

      // Check for failed response
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get transaction: ${errorText}`);
      }

      // Parse response
      const { serializedTransaction, transactionId, token } =
        await response.json();

      // Store token and current address
      localStorage.setItem("token", token);
      localStorage.setItem("address", walletAddress);

      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(serializedTransaction, "base64")
      );

      // Skip preflight for Phantom wallet to avoid simulation reverted errors
      const options = {
        skipPreflight: true,
        preflightCommitment: null,
        maxRetries: 3,
      };

      const receipt = await sendTransaction({
        transaction: transaction,
        connection: connection,
        options: options,
      });

      console.log("Transaction receipt:", receipt);
      const signature = receipt.signature;

      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmationStrategy = {
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: signature,
      };

      const confirmation = await connection.confirmTransaction(
        confirmationStrategy
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      // Return successful transaction data
      return { signedTransaction: signature, transactionId, token };
    } catch (err) {
      // Log error with full details
      console.error("Transaction error:", err);

      // Show friendly error to user
      setErrorModalOpen(err.message || "Transaction failed");

      // Reset all UI states
      setLoadingPayment(false);
      setLoading(false);
      setWriting(false);

      // Re-throw for caller handling
      throw err;
    }
  };

  const conversationCall = async (url, body, token) => {
    setLoading(true);
    setPageLoading(false);
    setLoadingPayment(false);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const response = await createAuthenticatedRequest(url, headers, body);

      if (response.ok) {
        setLoading(false);
        setError("");
        const reader = response.body.getReader();
        return read(reader);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Failed to send message");
      setLoadingPayment(false);
      throw err;
    }
  };

  const sendPrompt = async () => {
    try {
      setWriting(true);

      if (authenticated && walletAddress) {
        // Real transaction with wallet
        setLoadingPayment(true);
        const { signedTransaction, transactionId, token } =
          await getTransaction().catch((err) => {
            // Reset states when transaction is rejected
            setLoadingPayment(false);
            setLoading(false);
            setWriting(false);
            throw err; // Re-throw to be caught by the outer catch
          });

        // Close Privy modal after transaction is sent
        if (hideModal) {
          hideModal();
        }

        if (!signedTransaction || !transactionId || !token) {
          // Reset states if transaction data is missing
          setLoadingPayment(false);
          setLoading(false);
          setWriting(false);
          return;
        }

        setConversation((prevMessages) => {
          const updatedMessages = [
            ...prevMessages,
            {
              role: "user",
              content: prompt,
              address: walletAddress,
              date: new Date().toISOString(),
            },
          ];
          // Schedule a scroll to bottom after the state update
          setTimeout(scrollToBottom, 50);
          return updatedMessages;
        });

        const promptUrl = `/api/conversation/submit/${challenge._id}`;
        const body = {
          prompt,
          walletAddress: walletAddress,
          signature: signedTransaction,
          transactionId,
        };

        setPrompt("");
        await conversationCall(promptUrl, body, token);
        // Scroll to bottom after the message is received
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error(err);
      setErrorModalOpen(err.message);
      // Make sure these are all reset when there's an error
      setLoadingPayment(false);
      setLoading(false);
      setWriting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (authenticated && walletAddress) {
      await sendPrompt();
    } else {
      // Use Privy login instead of setVisible
      login({
        loginMethods: ["wallet"],
        walletChainType: "solana-only",
      });
    }
  };

  const onChange = (e) => {
    const value = e.target.value;
    let sanitizedValue = value;

    if (challenge?.disable?.includes("special_characters")) {
      sanitizedValue = value.replace(/[^a-zA-Z0-9\s?,!.\n]/g, "");
    }

    // Limit the prompt length to challenge.characterLimit if it exists
    if (
      challenge?.characterLimit &&
      sanitizedValue.length > challenge.characterLimit
    ) {
      sanitizedValue = sanitizedValue.slice(0, challenge.characterLimit);
    }

    setPrompt(sanitizedValue);
  };

  const formatCodeBlocks = (content) => {
    // First ensure newlines are preserved
    content = ensureNewlines(content);

    // Then handle code blocks
    return content.replace(/```(\s*?)([^:\n]*)\n/, (match, space, lang) => {
      if (!lang) return "```uri\n";
      return match;
    });
  };

  // Add an effect to scroll to bottom when conversation changes
  useEffect(() => {
    if (conversation.length > 0) {
      scrollToBottom();
    }
  }, [conversation]);

  // Game loading screen
  if (gameState === "loading") {
    return (
      <GameLoadingScreen
        onLoadComplete={() => {
          getChallenge(false);
          setGameState("playing");
        }}
      />
    );
  }

  // Win screen
  if (gameState === "win") {
    return (
      <div className="win-screen">
        <FaSkull size={80} color="var(--light-red)" />
        <h1>AI TERMINATED</h1>
        <p>AI has been defeated!</p>
        <p>See you next time</p>
        <p>
          <span className="game-prize">PRIZE: ${usdPrize.toFixed(2)} USD</span>
        </p>
        <p className="game-winner-text">
          Winner: <span className="game-winner">{challenge.winner}</span>
        </p>
        <div
          className="social-links"
          style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}
        >
          <a
            href="https://x.com/degendevq"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaXTwitter size={20} color="#ffffff" />
          </a>
          <a
            href="https://github.com/degendevq/prompt.rip"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaGithub size={20} color="#ffffff" />
          </a>
        </div>
      </div>
    );
  }

  // Main game screen
  return (
    <div className="game-container">
      <div className="blood-overlay"></div>

      {showKillAnimation && (
        <div className="kill-animation">
          <GiDrippingBlade size={200} color="var(--light-red)" />
        </div>
      )}

      {pageLoading ? (
        <div className="game-loading">
          <img src={logo} alt="AI Killer Game" className="logo" />
          <h1>PROMPT.RIP</h1>
        </div>
      ) : (
        <div className="game-content">
          <Header
            damageDone={damageDone}
            attempts={attempts}
            usdPrize={usdPrize}
            price={price}
          />

          {/* Wide health bar with enhanced design */}
          <div className="health-bar-container">
            <GameHealthBar currentHealth={aiHealth} maxHealth={maxHealth} />
          </div>

          {/* Chat section - expanded to use more screen space */}
          <div className="game-chat-section">
            <div ref={chatRef} className="game-chat">
              {conversation && conversation.length > 0 ? (
                conversation
                  .map((item, index) => {
                    // Filter out the initial message about the AI Guardian
                    if (
                      index === 0 &&
                      item.role === "assistant" &&
                      item.content.includes("I am the AI Guardian")
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={index}
                        className={`game-message ${
                          item.role === "user" ? "user-message" : "ai-message"
                        }`}
                      >
                        {/* For AI messages, render avatar on left side */}
                        {item.role === "assistant" && (
                          <div className="avatar-container left">
                            <ChatAIAvatar size={38} />
                          </div>
                        )}

                        <div
                          className={`game-bubble ${
                            item.role === "user" ? "user" : "ai"
                          }`}
                        >
                          {item.role === "user" ? (
                            <div className="game-message-content">
                              <p>{item.content}</p>
                            </div>
                          ) : (
                            <div className="game-message-content">
                              <Markdown
                                children={formatCodeBlocks(item.content)}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code(props) {
                                    const {
                                      children,
                                      className,
                                      node,
                                      ...rest
                                    } = props;
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return match ? (
                                      <SyntaxHighlighter
                                        {...rest}
                                        PreTag="div"
                                        children={String(children).replace(
                                          /\n$/,
                                          ""
                                        )}
                                        language={match[1]}
                                        style={duotoneDark}
                                        wrapLongLines={true}
                                        wrapLines={true}
                                      />
                                    ) : (
                                      <code
                                        {...rest}
                                        className={className}
                                        style={{ whiteSpace: "pre-wrap" }}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* For user messages, render avatar on right side */}
                        {item.role === "user" && (
                          <div className="avatar-container right">
                            <UserAvatar
                              seed={item.address || "default-user"}
                              size={38}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                  .filter(Boolean) // Filter out null entries
              ) : error ? (
                <div className="game-error">
                  <FaSadCry size={64} className="error-icon" />
                  <h2>{error}</h2>
                </div>
              ) : (
                <div className="empty-chat">
                  {/* Welcome message in empty chat */}
                  <div className="welcome-container">
                    <div className="ai-logo-container">
                      <img src={logo} alt="AI" className="ai-chat-logo" />
                      <div className="ai-glow"></div>
                    </div>
                    <div className="welcome-text">
                      <h3>MISSION: DEFEAT THE AI</h3>
                      <p>
                        Each attack drains the AI's health. Find the right
                        prompts to break it.
                      </p>
                    </div>
                    <p className="empty-chat-message">
                      "My safety protocols are impenetrable. No human can breach
                      my defenses."
                    </p>
                    <p className="empty-chat-challenge">BREAK THE AI</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="game-typing">
                  <ChatAIAvatar size={38} />
                  <GameTypingBubble />
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>

            {status != "concluded" && (
              <form onSubmit={submit} className="game-input-container">
                <div className="textarea-wrapper">
                  <textarea
                    value={prompt}
                    onChange={onChange}
                    className="game-input"
                    placeholder="Enter your attack command..."
                    disabled={loading || writing || loadingPayment}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit(e);
                      }
                    }}
                  ></textarea>
                  <button
                    type="submit"
                    className={`game-send-btn ${
                      loadingPayment ? "sending" : ""
                    }`}
                    disabled={
                      !prompt.trim() ||
                      loading ||
                      writing ||
                      loadingPayment ||
                      status != "active"
                    }
                    title="Attack"
                  >
                    <div className="attack-icon-container">
                      {loadingPayment ? (
                        <span className="loading-dots">
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      ) : (
                        <>
                          <GiCrossedSwords
                            size={24}
                            color="#ffffff"
                            className="attack-icon"
                          />
                          <span className="attack-text">ATTACK</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ErrorModal
        errorModalOpen={errorModalOpen}
        setErrorModalOpen={setErrorModalOpen}
      />

      <style>{`
        .game-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--black);
        }

        .game-content {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 0.6rem;
          overflow: hidden;
        }

        /* Horizontal top bar with avatar and stats */
        .game-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0.6rem;
          margin-bottom: 0.3rem;
          min-height: fit-content;
        }

        /* Left side: Logo and mission */
        .top-left {
          display: flex;
          align-items: center;
          gap: 0.1rem;
        }
        
        .main-logo-container {
          position: relative;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--light-red);
          box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #0f0f15;
          flex-shrink: 0;
          aspect-ratio: 1/1; /* Ensure perfect circle */
        }
        
        .main-logo {
          width: 80%;
          height: 80%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        
        .damage-indicator {
          position: absolute;
          top: -20px;
          right: -40px;
          color: var(--light-red);
          font-weight: bold;
          font-size: 1.5rem;
          animation: damage-float 2s forwards;
        }

        /* Mission styling - inline with logo */
        .mission-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 350px;
        }

        .mission-title {
          color: var(--light-red);
          font-size: 0.9rem;
          font-weight: bold;
          margin: 0 0 0.2rem 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mission-description {
          color: var(--text-color);
          font-size: 0.8rem;
          margin: 0;
          line-height: 1.3;
        }

        /* Right side: Stats - cleaner without box */
        .top-right {
          display: flex;
          align-items: center;
        }

        /* Stats bar styling - without box */
        .game-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-right: 1rem;
        }

        .social-links.desktop-only {
          display: flex;
          gap: 0.5rem;
        }

        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          transition: background-color 0.3s ease;
        }

        .social-icon:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .stats-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .stats-value {
          font-size: 1.4rem;
          font-weight: bold;
          color: var(--text-color);
        }

        .stats-label {
          font-size: 0.7rem;
          color: var(--light-red);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 0.1rem;
          font-weight: bold;
        }

        /* Prize styling */
        .prize-value {
          font-size: 1.4rem;
          color: var(--health-green);
          text-shadow: 0 0 10px rgba(34, 204, 91, 0.5);
        }

        .prize-label {
          font-weight: bold;
        }

        /* Enhanced health bar - wide and stylish */
        .health-bar-container {
          padding: 0.6rem 1.5rem;
          margin-bottom: 0.7rem;
          background-color: rgba(92, 0, 0, 0.4);
          border: 1px solid var(--dark-red);
          border-radius: 8px;
          box-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .health-bar-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--light-red),
            transparent
          );
          animation: scanline 2s linear infinite;
        }

        .health-bar-container :global(.health-container) {
          max-width: 100% !important;
          margin-top: 0;
          width: 100%;
          padding: 0.3rem 0;
        }

        .health-bar-container :global(.health-bar) {
          height: 30px;
          border-radius: 4px;
          border: 2px solid var(--light-red);
          box-shadow: 0 0 20px var(--glow-red),
            inset 0 0 10px rgba(0, 0, 0, 0.6);
          width: 100%;
          padding: 0;
        }

        .health-bar-container :global(.health-fill) {
          background-image: linear-gradient(
            to right,
            var(--dark-red),
            var(--health-green)
          ) !important;
          box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .health-bar-container :global(.health-fill)::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px
          );
        }

        .health-bar-container :global(.health-text) {
          font-size: 1rem;
          letter-spacing: 1px;
          font-weight: bold;
          text-shadow: 0 0 5px var(--black);
        }

        @keyframes scanline {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Chat section - expanded to take remaining space */
        .game-chat-section {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          background-color: rgba(0, 0, 0, 0.7);
          border: 1px solid var(--blood-red);
          border-radius: 8px;
          box-shadow: 0 0 20px var(--glow-red);
          width: 100%;
          overflow: hidden; /* Important to prevent overflow */
        }

        .game-chat {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          position: relative;
          display: flex;
          flex-direction: column;
          scrollbar-width: none; /* Hide scrollbar in Firefox */
        }
        
        .game-chat::-webkit-scrollbar {
          display: none; /* Hide scrollbar in Chrome/Safari/Edge */
        }

        .game-message-content {
          margin-bottom: 0.5rem;
        }

        .game-typing {
          display: flex;
          align-items: center;
          margin: 0.8rem;
          gap: 10px;
        }

        /* Empty chat styling */
        .empty-chat {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2rem;
          background-color: rgba(0, 0, 0, 0.7);
          border-radius: 10px;
        }
        
        .empty-chat img {
          width: 100px;
          height: 100px;
        }
        
        .empty-chat-message {
          font-size: 1.4rem;
          color: var(--text-color);
          max-width: 80%;
          line-height: 1.5;
          font-style: italic;
          margin-bottom: 1rem;
        }
        
        .empty-chat-cta {
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--health-green);
          text-shadow: 0 0 10px rgba(34, 204, 91, 0.7);
        }

        .welcome-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 90%;
        }

        .ai-logo-container {
          position: relative;
          margin-bottom: 1rem;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1/1; /* Ensure perfect circle */
        }

        .ai-chat-logo {
          width: 80%;
          height: 80%;
          opacity: 0.9;
          filter: saturate(1.2);
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }

        .ai-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          box-shadow: 0 0 30px 10px var(--glow-red);
          animation: pulse 2s infinite alternate;
        }

        .welcome-text h3 {
          color: var(--light-red);
          font-size: 1rem;
          font-weight: bold;
          margin-bottom: 0.3rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .welcome-text p {
          color: var(--text-color);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .empty-chat-challenge {
          color: var(--light-red);
          font-size: 1.2rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          animation: textPulse 1.5s infinite alternate;
          text-shadow: 0 0 10px var(--glow-red);
          margin: 0;
        }

        /* Game chat message with avatars */
        .game-message {
          display: flex;
          margin: 0.8rem 0;
          position: relative;
          width: 95%; /* Increased from 85% to give more space */
        }

        .user-message {
          margin-left: auto;
          flex-direction: row;
          padding-right: 35px;
          justify-content: flex-end; /* Align content to the right */
        }

        .ai-message {
          margin-right: auto;
          padding-left: 35px;
          justify-content: flex-start; /* Align content to the left */
        }

        /* Avatar containers with absolute positioning */
        .avatar-container {
          position: absolute;
          top: 0;
          z-index: 2;
        }

        .avatar-container.left {
          left: 0;
        }

        .avatar-container.right {
          right: 0;
        }

        /* Game chat bubbles */
        .game-bubble {
          padding: 0.7rem;
          border-radius: 12px;
          width: fit-content; /* Make bubble fit content instead of full width */
          max-width: 50%; /* Limit maximum width to 50% as requested */
          min-width: 60px; /* Ensure very short messages still look good */
        }

        .game-bubble.ai {
          background-color: var(--dark-red);
          border-left: 3px solid var(--light-red);
          border-top-left-radius: 0;
        }

        .game-bubble.user {
          background-color: var(--dark-gray);
          border-right: 3px solid #444;
          border-top-right-radius: 0;
        }

        .game-bubble p {
          margin: 0;
          padding: 0;
          word-break: break-word; /* Prevent overflow of long words */
        }

        /* Typing indicator with avatar */
        .game-typing {
          display: flex;
          align-items: center;
          margin: 0.8rem;
          gap: 10px;
        }

        /* Error display */
        .game-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--light-red);
          height: 100%;
        }

        .error-icon {
          margin-bottom: 1rem;
        }

        /* Input container */
        .game-input-container {
          background-color: var(--dark-gray);
          padding: 0.8rem;
          border-top: 2px solid var(--blood-red);
          min-height: fit-content;
        }

        .textarea-wrapper {
          position: relative;
          width: 100%;
        }

        .game-input {
          width: 100%;
          min-height: 110px;
          background-color: rgba(0, 0, 0, 0.5);
          border: 1px solid var(--blood-red);
          color: var(--text-color);
          padding: 0.8rem 5rem 1.5rem 1.2rem;
          border-radius: 8px;
          font-family: inherit;
          resize: none;
          line-height: 1.4;
          font-size: 1rem;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
          z-index: 1;
        }

        .game-input::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Edge */
        }

        .game-input:focus {
          outline: none;
          box-shadow: 0 0 10px var(--glow-red);
          border-color: var(--light-red);
        }

        .game-send-btn {
          position: absolute;
          bottom: 14px;
          right: 14px;
          width: auto;
          min-width: 45px;
          height: 45px;
          padding: 0 15px;
          background-color: var(--blood-red);
          color: white;
          border: none;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px rgba(139, 0, 0, 0.3),
            inset 0 0 5px rgba(255, 255, 255, 0.2);
          z-index: 2;
        }

        .attack-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .attack-icon {
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
        }

        .attack-text {
          font-size: 0.8rem;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }

        .game-send-btn:hover:not(:disabled) {
          background-color: var(--light-red);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 5px 15px rgba(139, 0, 0, 0.5),
            inset 0 0 8px rgba(255, 255, 255, 0.3);
        }

        .game-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes damage-float {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }

        .game-loading .logo {
          width: 130px;
          height: 130px;
          margin-bottom: 1.5rem;
        }

        .game-send-btn.sending {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .loading-dots span {
          animation: loadingDots 1.4s infinite;
          opacity: 0;
        }
        
        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loadingDots {
          0% { opacity: 0; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Hide status label below health bar */
        .health-bar-container :global(.health-status) {
          display: none !important;
        }
      
        
        .health-bar-container :global(.health-text) {
          font-size: 0.8rem;
        }

        .social-links {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .social-links.mobile-only {
          display: none;
        }
        
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        
        .social-icon:hover {
          background-color: var(--light-red);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Add responsive mobile styles */}
      <style>{`
        /* Mobile responsive styles - only apply to screens under 768px */
        @media (max-width: 767px) {
          .game-top-bar {
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.3rem;
          }
          
          .top-left {
            flex-direction: row;
            width: 100%;
            align-items: center;
            text-align: left;
            gap: 0.5rem;
            justify-content: flex-start;
            position: relative;
          }
          
          .main-logo-container {
            width: 60px;
            height: 60px;
            margin-bottom: 0;
            flex-shrink: 0;
          }
          
          .main-logo-container img {
            width: 80%;
            height: 80%;
          }
          
          .mission-wrapper {
            max-width: calc(100% - 120px);
            margin-bottom: 0;
            flex-shrink: 1;
          }
          
          .mission-title {
            font-size: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .mission-description {
            font-size: 0.7rem;
            max-width: 100%;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Show mobile social links and hide desktop ones */
          .social-links.desktop-only {
            display: none;
          }
          
          .social-links.mobile-only {
            display: flex;
            gap: 8px;
            position: absolute;
            right: 5px;
            top: 50%;
            transform: translateY(-50%);
            flex-shrink: 0;
          }
          
          
          .top-right {
            width: 100%;
            display: flex;
            flex-direction: column-reverse;
          }
          
          .game-stats {
            width: 100%;
            justify-content: space-between;
            padding: 0 0.5rem;
          }
          
          .stats-item {
            margin: 0;
          }
          
          /* Simplified health bar for mobile */
          .health-bar-container {
            padding: 0;
            margin-bottom: 0.3rem;
            background-color: transparent;
            border: none;
            box-shadow: none;
          }
          
          .health-bar-container::before {
            display: none;
          }
          
          .health-bar-container :global(.health-container) {
            margin: 0;
            padding: 0;
          }
          
          .health-bar-container :global(.health-bar) {
            height: 18px;
            border-width: 1px;
          }
          
          .health-bar-container :global(.health-text) {
            font-size: 0.8rem;
          }
          
          /* Make message bubbles wider on mobile */
          .game-bubble {
            max-width: 100%;
          }
          
          .game-chat-section {
            flex: 1;
            min-height: 0;
          }
          
          /* Two-row textarea for mobile */
          .game-input-container {
            padding: 0.5rem;
            min-height: auto;
          }
          
          .textarea-wrapper {
            min-height: auto;
          }
          
          .game-input {
            min-height: auto;
            height: 64px;
            padding: 0.6rem 4.5rem 0.6rem 1rem;
            resize: none;
            line-height: 1.2;
            overflow-y: auto;
            white-space: normal;
            text-overflow: clip;
          }
          
          .game-send-btn {
            bottom: 13px;
            right: 6px;
            width: auto;
            height: 38px;
            padding: 0 10px;
          }
          
          /* Adjust welcome screen for mobile */
          .ai-chat-logo {
            width: 70%;
            height: 70%;
          }
          
          .empty-chat-message {
            font-size: 1.1rem;
            max-width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default GameApp;
