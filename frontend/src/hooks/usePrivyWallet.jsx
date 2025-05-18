import { useEffect, useState, useRef } from "react";
import { useSolanaWallets, usePrivy } from "@privy-io/react-auth";

import { Connection, PublicKey } from "@solana/web3.js";

const mode = import.meta.env.VITE_MODE;
const DEVNET_RPC = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL;
const MAINNET_RPC = import.meta.env.VITE_SOLANA_MAINNET_RPC_URL;

const SOLANA_RPC_ENDPOINT = mode === "development" ? DEVNET_RPC : MAINNET_RPC;
const isDev = mode === "development";

// Create a module-level instance counter to track hook instances
let instanceCounter = 0;

export function usePrivyWallet() {
  const { wallets } = useSolanaWallets();
  const { user, authenticated, ready } = usePrivy();
  const [privyWallet, setPrivyWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initialFetchDone = useRef(false);
  const isFetchingRef = useRef(false);
  const intervalIdRef = useRef(null);
  const instanceId = useRef(++instanceCounter);

  // Debug on mount to see how many instances are created
  useEffect(() => {
    console.log(`[Wallet-${instanceId.current}] Hook instance created`);

    return () => {
      console.log(`[Wallet-${instanceId.current}] Hook instance destroyed`);
    };
  }, []);

  // Find the Privy wallet from all available wallets
  useEffect(() => {
    if (ready && authenticated && wallets && Array.isArray(wallets)) {
      // Log all available wallets for debugging
      console.log(
        `[Wallet-${instanceId.current}] All available wallets:`,
        wallets.map((w) => ({
          type: w.walletClientType,
          address: w.address,
          canEmbed: w.canEmbed,
        }))
      );

      // Look for embedded Privy wallet first
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy" && w.address
      );

      // Fall back to any connected wallet if embedded not found
      const anyWallet = embeddedWallet || wallets.find((w) => w.address);

      if (anyWallet) {
        console.log(
          `[Wallet-${instanceId.current}] Setting active wallet:`,
          anyWallet.walletClientType,
          anyWallet.address
        );
        setPrivyWallet(anyWallet);
        setWalletAddress(anyWallet.address);
      } else {
        console.log(`[Wallet-${instanceId.current}] No usable wallet found`);
        setPrivyWallet(null);
        setWalletAddress(null);
      }
    } else if (!ready || !authenticated) {
      // Reset wallet state when not ready or authenticated
      setPrivyWallet(null);
      setWalletAddress(null);
    }
  }, [wallets, authenticated, ready, user]);

  // Fetch balance for the active wallet
  useEffect(() => {
    let isMounted = true; // Track if component is mounted

    // Reset initialFetchDone when wallet address changes
    initialFetchDone.current = false;

    const fetchBalance = async (address, isPolling = false) => {
      // Prevent concurrent fetches and skip if not mounted
      if (!address || !isMounted || isFetchingRef.current) return;

      // Set fetching flag to prevent concurrent calls
      isFetchingRef.current = true;

      try {
        console.log(
          `[Wallet-${instanceId.current}] Fetching balance ${
            isPolling ? "(polling)" : "(initial)"
          }`
        );

        // Only show loading on initial fetch, not during polling updates
        if (!initialFetchDone.current) {
          setLoading(true);
        }

        const connection = new Connection(SOLANA_RPC_ENDPOINT);
        const publicKey = new PublicKey(address);
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / 1e9;

        console.log(
          `[Wallet-${instanceId.current}] Balance:`,
          solBalance,
          "SOL"
        );

        // Check if component is still mounted before updating state
        if (isMounted) {
          setBalance(solBalance);
          initialFetchDone.current = true;
          setError(null); // Clear any previous error
        }
      } catch (err) {
        console.error(
          `[Wallet-${instanceId.current}] Balance fetch error:`,
          err
        );

        // Only update state if component is still mounted
        if (isMounted) {
          setError(err?.message || "Error fetching balance");
          // Don't set balance to null on error if we already have a value
          if (balance === null) {
            setBalance(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        // Release the fetching lock
        isFetchingRef.current = false;
      }
    };

    // Clear any existing interval when wallet address changes
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (walletAddress) {
      // Fetch immediately
      fetchBalance(walletAddress, false);

      // Set up polling with a reasonable interval (10 seconds)
      intervalIdRef.current = setInterval(() => {
        fetchBalance(walletAddress, true);
      }, 2000);

      console.log(`[Wallet-${instanceId.current}] Started polling interval`);
    } else {
      setBalance(null);
    }

    // Cleanup on unmount or when wallet changes
    return () => {
      isMounted = false; // Mark as unmounted
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.log(`[Wallet-${instanceId.current}] Cleared polling interval`);
      }
    };
  }, [walletAddress]);

  return {
    privyWallet,
    walletAddress,
    balance,
    loading,
    error,
  };
}
