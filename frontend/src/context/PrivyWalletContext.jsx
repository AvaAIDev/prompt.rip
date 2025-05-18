import React, { createContext, useContext } from "react";
import { usePrivyWallet as usePrivyWalletHook } from "../hooks/usePrivyWallet";

const PrivyWalletContext = createContext(null);

export function PrivyWalletProvider({ children }) {
  const walletData = usePrivyWalletHook();
  console.log("PrivyWalletProvider: Creating single wallet instance");

  return (
    <PrivyWalletContext.Provider value={walletData}>
      {children}
    </PrivyWalletContext.Provider>
  );
}

export function usePrivyWalletContext() {
  const context = useContext(PrivyWalletContext);
  if (!context) {
    throw new Error(
      "usePrivyWalletContext must be used within a PrivyWalletProvider"
    );
  }
  return context;
}
