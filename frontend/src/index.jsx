import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import GameApp from "./components/GameApp";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { Buffer } from "buffer";
window.Buffer = Buffer;
import ClientWalletProvider from "./providers/WalletProvider";
import { PrivyWalletProvider } from "./context/PrivyWalletContext";
const appId = import.meta.env.VITE_PRIVY_APP_ID;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <PrivyProvider
      appId="cmaqs8k3202cnjr0monllejkd"
      config={{
        loginMethods: ["wallet"],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(["phantom"]),
          },
        },
        embeddedWallets: {
          showWalletUIs: false,
        },
      }}
    >
      <PrivyWalletProvider>
        <ClientWalletProvider>
          <Routes>
            <Route path="/" element={<GameApp />} />
            <Route path="/game" element={<GameApp />} />
            <Route path="/:name" element={<GameApp />} />
          </Routes>
        </ClientWalletProvider>
      </PrivyWalletProvider>
    </PrivyProvider>
  </BrowserRouter>
);
