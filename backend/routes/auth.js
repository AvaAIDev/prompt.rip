import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import express from "express";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { solanaAuth } from "../middleware/solanaAuth.js";

const router = express.Router();

dotenv.config();

// Verify and validate token
router.get("/verify-token", async (req, res) => {
  try {
    // Get current token and address from request
    const authHeader = req.headers.authorization;
    const currentWalletAddress = req.headers.address;

    if (!authHeader?.startsWith("Bearer ") || !authHeader.split(" ")[1]) {
      return res.status(401).json({
        valid: false,
        error: "No token provided",
      });
    }

    if (!currentWalletAddress) {
      return res.status(401).json({
        valid: false,
        error: "No wallet address provided",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verify the token is valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token belongs to current wallet
      if (decoded.walletAddress !== currentWalletAddress) {
        console.log(
          "Token wallet mismatch in verify-token:",
          decoded.walletAddress,
          "vs current:",
          currentWalletAddress
        );
        return res.status(401).json({
          valid: false,
          error: "Token belongs to different wallet",
          tokenWallet: decoded.walletAddress,
          currentWallet: currentWalletAddress,
        });
      }

      // Token is valid and matches current wallet
      return res.status(200).json({
        valid: true,
        walletAddress: decoded.walletAddress,
      });
    } catch (err) {
      console.log("Token verification failed:", err.message);
      return res.status(401).json({
        valid: false,
        error: err.message,
      });
    }
  } catch (error) {
    console.error("Error in verify-token:", error);
    return res.status(500).json({
      valid: false,
      error: "Server error during token verification",
    });
  }
});

export const createToken = async (req, res) => {
  try {
    const { signature, publickey, message, timestamp } = req.headers;

    // Check if all required headers are present
    if (!signature || !publickey || !message || !timestamp) {
      return res.status(401).json({ error: "Missing authentication headers" });
    }

    // Verify timestamp is within 5 minutes
    const now = Date.now();
    const messageTime = parseInt(timestamp);
    if (now - messageTime > 5 * 60 * 1000) {
      return res.status(401).json({ error: "Message expired" });
    }

    // Verify public key is valid
    let publicKey;
    try {
      publicKey = new PublicKey(publickey);
    } catch (error) {
      return res.status(401).json({ error: "Invalid public key" });
    }

    // Verify signature
    const verified = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      publicKey.toBytes()
    );

    if (!verified) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Generate JWT token after successful verification
    const token = jwt.sign(
      {
        walletAddress: publickey,
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "168h" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Token creation error:", error);
    return res.status(401).json({ error: "Token creation failed" });
  }
};

// Other auth routes using solanaAuth middleware
router.post("/authenticate", solanaAuth, (req, res) => {
  res.json({ token: req.user.token });
});

// Add to your routes:
router.post("/create-token", createToken);

export default router;
