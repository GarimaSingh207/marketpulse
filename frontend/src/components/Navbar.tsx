import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <span className="navbar-brand">MarketPulse</span>
      <div className="navbar-right">
        {user && (
          <span className="navbar-user">
            {user.name} · <span style={{ color: "var(--accent)" }}>{user.role}</span>
          </span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={logout} aria-label="Logout">
          Sign out
        </button>
      </div>
    </header>
  );
}
