import React from "react";
import "../styles/GameTheme.css";

const GameTypingBubble = () => {
  return (
    <div className="game-typing-bubble">
      <div className="game-dot"></div>
      <div className="game-dot"></div>
      <div className="game-dot"></div>
      <style>{`
        .game-typing-bubble {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 30px;
          background-color: var(--dark-red);
          border-radius: 8px;
          padding: 8px;
          margin-top: 5px;
          box-shadow: 0 0 8px var(--glow-red);
        }

        .game-dot {
          width: 8px;
          height: 8px;
          margin: 0 3px;
          background-color: var(--light-red);
          border-radius: 50%;
          animation: gameTypingBubble 1.5s infinite;
        }

        .game-dot:nth-child(1) {
          animation-delay: 0s;
        }

        .game-dot:nth-child(2) {
          animation-delay: 0.3s;
        }

        .game-dot:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes gameTypingBubble {
          0%,
          60%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 5px var(--glow-red);
          }
        }
      `}</style>
    </div>
  );
};

export default GameTypingBubble;
