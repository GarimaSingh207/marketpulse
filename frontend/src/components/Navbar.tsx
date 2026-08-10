import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Menu, LogOut, Search, Bell } from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <header className="navbar" role="banner">
      {/* Left */}
      <div className="navbar-left">
        {/* Mobile toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="navbar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={false}
        >
          <Menu size={16} strokeWidth={2.5} />
        </motion.button>

        {/* Mobile brand */}
        <span className="navbar-brand-mobile" aria-hidden="true">
          MarketPulse
        </span>

        {/* Search */}
        <div className="navbar-search" role="search">
          <Search
            size={14}
            className="navbar-search-icon"
            aria-hidden="true"
          />
          <input
            type="search"
            className="navbar-search-input"
            placeholder="Search assets, portfolios…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search assets and portfolios"
            disabled
          />
          <AnimatePresence>
            {!searchFocused && !searchVal && (
              <motion.div
                className="navbar-search-kbd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-hidden="true"
              >
                <span className="kbd">⌘</span>
                <span className="kbd">K</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right */}
      <div className="navbar-right">
        {/* Market status indicator */}
        <div className="navbar-status" aria-label="Market status: Live">
          <div className="navbar-status-dot" aria-hidden="true" />
          <span>Live</span>
        </div>

        {/* Notification bell */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          className="navbar-icon-btn"
          aria-label="Notifications"
          disabled
        >
          <Bell size={15} strokeWidth={2} />
        </motion.button>

        <div className="navbar-divider" aria-hidden="true" />

        {/* User info */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <motion.div
              className="navbar-avatar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={user.name}
              aria-label={`User: ${user.name}`}
            >
              {getInitials(user.name)}
            </motion.div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user.name}</span>
              <span className="navbar-user-role">{user.role}</span>
            </div>
          </div>
        )}

        {/* Sign out */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="btn btn-ghost btn-sm"
          onClick={logout}
          aria-label="Logout"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <LogOut size={13} strokeWidth={2} />
          <span>Sign out</span>
        </motion.button>
      </div>
    </header>
  );
}
