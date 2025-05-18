import React, { useState, useEffect } from "react";
import "../styles/GameTheme.css";
import logo from "../assets/logo.png";

const GameLoadingScreen = ({ onLoadComplete }) => {
  // Simple state with no refs
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  // Single effect for loading animation
  useEffect(() => {
    console.log("Loading screen mounted");

    // Define loading text options
    const loadingTexts = [
      "Initializing AI system...",
      "Loading combat protocols...",
      "Analyzing weaknesses...",
      "Preparing defense mechanisms...",
      "Arming neural networks...",
      "Ready to fight human...",
    ];

    // Set total steps (35 steps = 3.5 seconds at 100ms interval)
    const totalSteps = 35;
    const interval = 100; // 100ms per step

    let currentStep = 0;

    // Create interval that simply increments by steps
    const timer = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(
        Math.floor((currentStep / totalSteps) * 100),
        100
      );

      // Log each update
      console.log(
        `Step ${currentStep}/${totalSteps}: Setting progress to ${progress}%`
      );

      // Update loading progress
      setLoadingProgress(progress);

      // Update text based on progress
      const textIndex = Math.min(
        Math.floor((progress / 100) * loadingTexts.length),
        loadingTexts.length - 1
      );
      setLoadingText(loadingTexts[textIndex]);

      // Check if complete
      if (progress >= 100) {
        clearInterval(timer);

        // Call the completion callback after a brief delay
        setTimeout(() => {
          console.log("Loading complete, calling onLoadComplete");
          if (onLoadComplete) onLoadComplete();
        }, 500);
      }
    }, interval);

    // Clean up on unmount
    return () => {
      clearInterval(timer);
      console.log("Loading screen unmounted");
    };
  }, []); // Empty dependency array - only run once on mount

  // Add blood splatters
  useEffect(() => {
    const addBloodSplatter = () => {
      const splatter = document.createElement("div");
      splatter.className = "blood-splatter";

      // Random position
      const randomTop = Math.random() * 100;
      const randomLeft = Math.random() * 100;
      const randomSize = Math.random() * 100 + 50;
      const randomRotate = Math.random() * 360;

      splatter.style.cssText = `
        position: absolute;
        top: ${randomTop}vh;
        left: ${randomLeft}vw;
        width: ${randomSize}px;
        height: ${randomSize}px;
        background-color: var(--blood-red);
        opacity: 0.3;
        border-radius: 50%;
        filter: blur(8px);
        transform: rotate(${randomRotate}deg);
      `;

      const container = document.querySelector(".game-loading");
      if (container) container.appendChild(splatter);

      // Remove after animation
      setTimeout(() => {
        if (splatter.parentNode) {
          splatter.parentNode.removeChild(splatter);
        }
      }, 3000);
    };

    const interval = setInterval(addBloodSplatter, 800);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="game-loading">
      <div className="blood-overlay"></div>
      <img src={logo} alt="AI Killer Game" className="logo" />
      <h1>PROMPT.RIP</h1>
      <p className="tagline">BREAK THE AI... OR DIE TRYING</p>

      <div className="loading-progress">
        <div className="loading-bar">
          <div
            className="loading-fill"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <div className="loading-percentage">{loadingProgress}%</div>
        <div className="loading-text">{loadingText}</div>
      </div>

      <style>{`
        .game-loading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: var(--black);
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .logo {
          width: 130px;
          height: 130px;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
        }

        h1,
        p,
        .tagline {
          text-align: center;
          width: 100%;
        }

        .loading-progress {
          width: 80%;
          max-width: 400px;
          margin-top: 2rem;
          text-align: center;
        }

        .loading-bar {
          height: 20px;
          background-color: var(--dark-gray);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          border: 2px solid var(--light-red);
          box-shadow: 0 0 10px var(--glow-red);
        }

        .loading-fill {
          height: 100%;
          background: var(--blood-red);
          position: relative;
          overflow: hidden;
          transition: width 90ms ease-out;
        }

        .loading-fill::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: loading-pulse 1.5s infinite;
        }

        @keyframes loading-pulse {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .loading-percentage {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1rem;
          color: var(--light-red);
          text-align: center;
          width: 100%;
          transition: opacity 0.2s ease;
        }

        .loading-text {
          font-size: 1rem;
          margin-top: 0.5rem;
          color: var(--text-color);
          opacity: 0.8;
          min-height: 1.5rem;
          text-align: center;
          width: 100%;
          transition: opacity 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default GameLoadingScreen;
