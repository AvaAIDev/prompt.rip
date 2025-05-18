import React, { useState, useEffect } from "react";
import "../styles/GameTheme.css";

const GameHealthBar = ({ currentHealth, maxHealth = 100 }) => {
  const [width, setWidth] = useState(100);
  const [status, setStatus] = useState("healthy");

  useEffect(() => {
    const percentage = (currentHealth / maxHealth) * 100;
    setWidth(percentage);

    if (percentage > 60) {
      setStatus("healthy");
    } else if (percentage > 30) {
      setStatus("injured");
    } else {
      setStatus("critical");
    }
  }, [currentHealth, maxHealth]);

  const createBloodDrop = () => {
    if (currentHealth === maxHealth) return null;

    // Create a blood drop whenever health decreases
    const bloodDrop = document.createElement("div");
    bloodDrop.className = "blood-drop";

    // Random position
    const randomLeft = Math.random() * 90 + 5; // 5-95%
    bloodDrop.style.left = `${randomLeft}%`;

    document.querySelector(".health-container").appendChild(bloodDrop);

    // Remove the element after animation completes
    setTimeout(() => {
      if (bloodDrop.parentNode) {
        bloodDrop.parentNode.removeChild(bloodDrop);
      }
    }, 2000);
  };

  useEffect(() => {
    createBloodDrop();
  }, [currentHealth]);

  return (
    <div className="health-container">
      <div className="health-bar">
        <div
          className={`health-fill ${status}`}
          style={{
            width: `${width}%`,
          }}
        >
          <div className="health-fill-animation"></div>
        </div>
        <div className="health-glow-overlay"></div>
        <div className="health-text">
          {currentHealth} / {maxHealth} HP
        </div>
      </div>
      <div className={`health-status ${status}`}>
        {status === "healthy" && "FUNCTIONAL"}
        {status === "injured" && "SYSTEM DAMAGE"}
        {status === "critical" && "CRITICAL FAILURE"}
      </div>

      <style>{`
        .health-container {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin: 5px 0;
        }

        .health-bar {
          width: 100%;
          height: 35px;
          background-color: var(--dark-gray);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          border: 2px solid var(--light-red);
          box-shadow: 0 0 15px var(--glow-red),
            inset 0 0 10px rgba(0, 0, 0, 0.7);
          animation: pulse-border 2s infinite alternate;
        }

        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 15px var(--glow-red),
              inset 0 0 10px rgba(0, 0, 0, 0.7);
          }
          100% {
            box-shadow: 0 0 25px var(--glow-red),
              inset 0 0 15px rgba(0, 0, 0, 0.7);
          }
        }

        .health-fill {
          height: 100%;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }

        .health-fill.healthy {
          background: var(--health-green);
        }

        .health-fill.injured {
          background-image: linear-gradient(
            to right,
            var(--health-yellow),
            #ffb700
          );
        }

        .health-fill.critical {
          background-image: linear-gradient(
            to right,
            #800000,
            var(--health-red)
          );
        }

        .health-fill::after {
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

        .health-fill-animation {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: flow 2s linear infinite;
        }

        .health-glow-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          pointer-events: none;
          animation: glow-pulse 3s infinite alternate;
        }

        @keyframes flow {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes glow-pulse {
          0% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.7;
          }
        }

        .health-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--text-color);
          font-size: 1.1rem;
          font-weight: bold;
          text-shadow: 0 0 5px var(--black);
          letter-spacing: 1px;
          mix-blend-mode: difference;
          z-index: 2;
          animation: pulse-text 4s infinite alternate;
        }

        @keyframes pulse-text {
          0% {
            text-shadow: 0 0 5px var(--black);
          }
          100% {
            text-shadow: 0 0 8px var(--light-red);
          }
        }

        .health-status {
          text-align: center;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: bold;
          width: 100%;
        }

        .health-status.healthy {
          color: var(--health-green);
          text-shadow: 0 0 5px rgba(34, 204, 91, 0.5);
          animation: status-pulse 2s infinite alternate;
        }

        .health-status.injured {
          color: var(--health-yellow);
          text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
          animation: status-pulse 1.5s infinite alternate;
        }

        .health-status.critical {
          color: var(--health-red);
          text-shadow: 0 0 8px rgba(255, 0, 0, 0.7);
          animation: critical-pulse 0.8s infinite alternate;
        }

        @keyframes status-pulse {
          0% {
            opacity: 0.8;
            text-shadow: 0 0 5px currentColor;
          }
          100% {
            opacity: 1;
            text-shadow: 0 0 10px currentColor;
          }
        }

        @keyframes critical-pulse {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            text-shadow: 0 0 15px var(--health-red);
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default GameHealthBar;
