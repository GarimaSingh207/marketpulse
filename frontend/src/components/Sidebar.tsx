import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Eye,
  TrendingUp,
  X,
  ChevronLeft,
  BarChart2,
} from "lucide-react";

const links = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/portfolios", icon: Briefcase,        label: "Portfolios" },
  { to: "/watchlists", icon: Eye,              label: "Watchlists" },
  { to: "/market",     icon: TrendingUp,       label: "Market" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`sidebar${isOpen ? " mobile-open" : ""}${isCollapsed ? " collapsed" : ""}`}
      aria-label="Main navigation"
    >
      <div className="sidebar-inner">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">
            <BarChart2 size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="sidebar-brand-text">
            <span>MarketPulse</span>
          </span>
        </div>

        {/* Close button (mobile) */}
        {onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={14} />
          </button>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Navigation</span>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                title={isCollapsed ? link.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Animated active background */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          background: "var(--accent-subtle)",
                          border: "1px solid var(--accent-border)",
                          zIndex: 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="sidebar-link-icon" style={{ position: "relative", zIndex: 1 }}>
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.5 : 2}
                        style={{
                          color: isActive ? "var(--accent-hover)" : "currentColor",
                          transition: "color 0.2s ease",
                        }}
                      />
                    </span>
                    <span
                      className="sidebar-link-label"
                      style={{ position: "relative", zIndex: 1 }}
                    >
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        {onToggleCollapse && (
          <div className="sidebar-toggle">
            <button
              className="sidebar-toggle-btn"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.span
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                <ChevronLeft size={15} />
              </motion.span>
              <span className="sidebar-toggle-text">Collapse</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
