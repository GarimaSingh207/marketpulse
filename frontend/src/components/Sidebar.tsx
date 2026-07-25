import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/portfolios", icon: "💼", label: "Portfolios" },
  { to: "/watchlists", icon: "👁", label: "Watchlists" },
  { to: "/market", icon: "📈", label: "Market" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">MarketPulse</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <span className="sidebar-icon" aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
