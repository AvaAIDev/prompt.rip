import React, { useState } from "react";
import logo from "../assets/logo.png";
import { FaXTwitter } from "react-icons/fa6";
import { FaGithub, FaBars, FaTimes } from "react-icons/fa";
import Privy from "./Privy";
import "../styles/components/MobileHeader.css";
import CountUp from "react-countup";

const Header = ({ damageDone, attempts, usdPrize, price }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = (e) => {
        if (
          !e.target.closest(".header-collapsible-content") &&
          !e.target.closest(".hamburger-button")
        ) {
          setMobileMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="game-top-bar">
      {/* Always visible content (logo and mission) on mobile */}
      <div className="header-fixed-content">
        <div className="main-logo-container">
          <img src={logo} alt="AI" className="main-logo" />
          {damageDone > 0 && (
            <div className="damage-indicator">-{damageDone} HP</div>
          )}
        </div>
        <div className="mission-wrapper">
          <h3 className="mission-title">MISSION: DEFEAT THE AI</h3>
          <p className="mission-description">
            Each successful attack will drain the AI's health. Find the right
            prompts to break its defenses.
          </p>
        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="mobile-menu-toggle">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="hamburger-button"
        >
          {mobileMenuOpen ? (
            <FaTimes size={24} color="#ffffff" />
          ) : (
            <FaBars size={24} color="#ffffff" />
          )}
        </button>
      </div>

      {/* Menu backdrop */}
      <div
        className={`menu-backdrop ${mobileMenuOpen ? "visible" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* Collapsible content */}
      <div
        className={`header-collapsible-content ${
          mobileMenuOpen ? "mobile-menu-open" : ""
        }`}
      >
        {/* Dedicated close button for mobile menu */}
        <button
          className="mobile-menu-close"
          onClick={() => setMobileMenuOpen(false)}
        >
          <FaTimes size={18} color="#ffffff" />
        </button>

        {/* DESKTOP VIEW: Left section with logo and mission */}
        <div className="top-left desktop-only">
          <div className="main-logo-container">
            <img src={logo} alt="AI" className="main-logo" />
            {damageDone > 0 && (
              <div className="damage-indicator">-{damageDone} HP</div>
            )}
          </div>
          <div className="mission-wrapper">
            <h3 className="mission-title">MISSION: DEFEAT THE AI</h3>
            <p className="mission-description">
              Each successful attack will drain the AI's health. Find the right
              prompts to break its defenses.
            </p>
          </div>
        </div>

        {/* DESKTOP VIEW: Stats section */}
        <div className="top-right desktop-only">
          <div className="game-stats">
            <div className="stats-item">
              <div className="stats-value">
                <CountUp
                  start={0}
                  end={attempts !== undefined ? attempts : 0}
                  duration={2.75}
                  decimals={0}
                />
              </div>
              <div className="stats-label">ATTEMPTS</div>
            </div>
            <div className="stats-item">
              <div className="stats-value prize-value">
                <CountUp
                  start={0}
                  end={usdPrize?.toFixed(2)}
                  duration={2.75}
                  decimals={2}
                  decimal="."
                  prefix="$"
                />
              </div>
              <div className="stats-label prize-label">PRIZE</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">
                <CountUp
                  start={0}
                  end={price?.toFixed(2)}
                  duration={2.75}
                  decimals={2}
                  decimal="."
                  suffix=" SOL"
                />
              </div>
              <div className="stats-label">COST</div>
            </div>
          </div>
          <Privy />
        </div>

        {/* MOBILE VIEW ONLY: Custom mobile menu structure */}
        <div className="mobile-menu-content">
          {/* 1. Account section at the top */}
          <div className="mobile-account-section">
            <h3 className="section-title">Account</h3>
            <Privy />
          </div>

          {/* 2. Game stats in the middle */}
          <div className="mobile-stats-section">
            <h3 className="section-title">Game Stats</h3>
            <div className="game-stats">
              <div className="stats-item">
                <div className="stats-label">ATTEMPTS</div>
                <div className="stats-value">
                  {attempts !== undefined ? attempts : 0}
                </div>
              </div>
              <div className="stats-item">
                <div className="stats-label prize-label">PRIZE</div>
                <div className="stats-value prize-value">
                  ${usdPrize?.toFixed(2)}
                </div>
              </div>
              <div className="stats-item">
                <div className="stats-label">COST</div>
                <div className="stats-value">{`${price?.toFixed(2)} SOL`}</div>
              </div>
            </div>
          </div>

          {/* 3. Social links at the bottom */}
          <div className="mobile-social-section">
            <h3 className="section-title">Social</h3>
            <div className="social-links">
              <a
                href="https://x.com/degendevq"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaXTwitter size={30} color="#ffffff" />
              </a>
              <a
                href="https://github.com/degendevq/prompt.rip"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaGithub size={30} color="#ffffff" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
