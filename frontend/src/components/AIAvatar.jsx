import React from "react";
import logo from "../assets/logo.png";

const AIAvatar = ({ size = 40 }) => {
  // For the main avatar, allow a much larger default size
  const actualSize = size === 40 ? 80 : size;

  return (
    <div className="ai-avatar">
      <img src={logo} alt="AI Avatar" />

      <style>{`
        .ai-avatar {
          width: ${actualSize}px;
          height: ${actualSize}px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--light-red);
          box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
          flex-shrink: 0;
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-avatar img {
          width: 85%;
          height: 85%;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
};

export { AIAvatar };
export default AIAvatar;
