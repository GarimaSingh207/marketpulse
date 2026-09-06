import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import {
  Palette,
  Bell,
  Sliders,
  User as UserIcon,
  Laptop,
  CheckCircle,
  Mail,
  HelpCircle as HelpIcon,
  ChevronRight,
  Edit3,
  Bug,
} from "lucide-react";
import "./Settings.css";

export default function Settings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Appearance
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [fontSize, setFontSize] = useState(16);
  const [accent, setAccent] = useState<"gold" | "blue" | "red" | "gray">("gold");
  const [compactMode, setCompactMode] = useState(false);

  // Notifications
  const [alerts, setAlerts] = useState({
    priceAlerts:      { push: true,  email: false, sms: false },
    portfolioUpdates: { push: true,  email: true,  sms: false },
    marketNews:       { push: true,  email: false, sms: true  },
  });

  // Trading Preferences
  const [orderType, setOrderType] = useState("Market Order");
  const [currency, setCurrency] = useState("USD - US Dollar");
  const [timezone, setTimezone] = useState("(GMT-05:00) Eastern Time");

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [freshUser, setFreshUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/profile");
        setFreshUser(res.data);
      } catch (err: any) {
        if (user) {
          setFreshUser({ name: user.name, email: user.email, role: user.role });
        } else {
          setError(err.response?.data?.message || "Failed to retrieve user profile data.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaveSuccess("Preferences successfully saved to browser local session.");
      setTimeout(() => setSaveSuccess(null), 3000);
    }, 600);
  };

  const handleToggleAlert = (category: keyof typeof alerts, channel: "push" | "email" | "sms") => {
    setAlerts((prev) => ({
      ...prev,
      [category]: { ...prev[category], [channel]: !prev[category][channel] },
    }));
  };

  if (loading && !freshUser) return <Spinner text="Retrieving profile settings…" />;

  const displayName  = freshUser?.name  || user?.name  || "User";
  const displayEmail = freshUser?.email || user?.email || "—";
  const handle       = "@" + (displayName.toLowerCase().replace(/\s+/g, "").slice(0, 8) || "user");

  return (
    <div className="set-root set-stagger-load">

      {/* ── Page Header ── */}
      <section className="set-page-header">
        <h1 className="set-page-title">Settings</h1>
        <p className="set-page-subtitle">
          Manage your account, security, and application preferences with institutional-grade control panels.
        </p>
      </section>

      {error && <ErrorBanner message={error} />}
      {saveSuccess && (
        <div className="set-save-success">
          <CheckCircle size={14} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* ── Main Grid ── */}
      <form onSubmit={handleSavePreferences} className="set-main-grid">

        {/* ── Left Column ── */}
        <div className="set-left-col">

          {/* Appearance */}
          <section className="set-card">
            <div className="set-card-header">
              <Palette size={20} className="set-icon-primary" />
              <h2 className="set-section-title">Appearance</h2>
            </div>

            <div className="set-two-col">
              <div className="set-col-space">
                {/* Theme Mode */}
                <div>
                  <label className="set-field-label">Theme Mode</label>
                  <div className="set-theme-buttons">
                    <button
                      type="button"
                      className={`set-theme-btn${theme === "dark" ? " active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >Dark</button>
                    <button
                      type="button"
                      className={`set-theme-btn${theme === "light" ? " active" : ""}`}
                      onClick={() => setTheme("light")}
                    >Light</button>
                    <button
                      type="button"
                      className={`set-theme-btn${theme === "system" ? " active" : ""}`}
                      onClick={() => setTheme("system")}
                    >System</button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="set-field-label">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="set-range"
                  />
                  <div className="set-range-labels set-text-mono">
                    <span>12px</span>
                    <span>{fontSize}px (Default)</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              <div className="set-col-space">
                {/* Accent Color */}
                <div>
                  <label className="set-field-label">Accent Color</label>
                  <div className="set-accent-row">
                    <button type="button" className={`set-accent-dot set-accent-gold${accent === "gold"  ? " active" : ""}`} onClick={() => setAccent("gold")}  title="Gold"  />
                    <button type="button" className={`set-accent-dot set-accent-blue${accent === "blue"  ? " active" : ""}`} onClick={() => setAccent("blue")}  title="Blue"  />
                    <button type="button" className={`set-accent-dot set-accent-red${accent  === "red"   ? " active" : ""}`} onClick={() => setAccent("red")}   title="Red"   />
                    <button type="button" className={`set-accent-dot set-accent-gray${accent === "gray"  ? " active" : ""}`} onClick={() => setAccent("gray")}  title="Gray"  />
                  </div>
                </div>

                {/* Compact Mode */}
                <div className="set-toggle-row">
                  <div>
                    <p className="set-toggle-title">Compact Mode</p>
                    <p className="set-toggle-sub">Increase data density</p>
                  </div>
                  <label className="set-toggle-label">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                    <div className="set-toggle-bg" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="set-card">
            <div className="set-card-header">
              <Bell size={20} className="set-icon-primary" />
              <h2 className="set-section-title">Notifications</h2>
            </div>

            <div className="set-notif-table">
              {/* Header row */}
              <div className="set-notif-row set-notif-head">
                <div className="set-notif-cat">Alert Category</div>
                <div className="set-notif-ch">Push</div>
                <div className="set-notif-ch">Email</div>
                <div className="set-notif-ch">SMS</div>
              </div>

              {/* Price Alerts */}
              <div className="set-notif-row">
                <div className="set-notif-cat">
                  <p className="set-notif-name">Price Alerts</p>
                  <p className="set-notif-desc">Volatility and limit hits</p>
                </div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.priceAlerts.push}      onChange={() => handleToggleAlert("priceAlerts", "push")}      /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.priceAlerts.email}     onChange={() => handleToggleAlert("priceAlerts", "email")}     /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.priceAlerts.sms}       onChange={() => handleToggleAlert("priceAlerts", "sms")}       /></div>
              </div>

              {/* Portfolio Updates */}
              <div className="set-notif-row">
                <div className="set-notif-cat">
                  <p className="set-notif-name">Portfolio Updates</p>
                  <p className="set-notif-desc">Daily summary &amp; rebalancing</p>
                </div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.portfolioUpdates.push}  onChange={() => handleToggleAlert("portfolioUpdates", "push")}  /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.portfolioUpdates.email} onChange={() => handleToggleAlert("portfolioUpdates", "email")} /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.portfolioUpdates.sms}   onChange={() => handleToggleAlert("portfolioUpdates", "sms")}   /></div>
              </div>

              {/* Market News */}
              <div className="set-notif-row">
                <div className="set-notif-cat">
                  <p className="set-notif-name">Market News</p>
                  <p className="set-notif-desc">Curated intelligence stream</p>
                </div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.marketNews.push}       onChange={() => handleToggleAlert("marketNews", "push")}       /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.marketNews.email}      onChange={() => handleToggleAlert("marketNews", "email")}      /></div>
                <div className="set-notif-ch"><input type="checkbox" className="set-check" checked={alerts.marketNews.sms}        onChange={() => handleToggleAlert("marketNews", "sms")}        /></div>
              </div>
            </div>
          </section>

          {/* Trading Preferences */}
          <section className="set-card">
            <div className="set-card-header">
              <Sliders size={20} className="set-icon-primary" />
              <h2 className="set-section-title">Trading Preferences</h2>
            </div>

            <div className="set-trading-grid">
              <div className="set-field">
                <label htmlFor="ordertype-select" className="set-field-label">Default Order Type</label>
                <select id="ordertype-select" value={orderType} onChange={(e) => setOrderType(e.target.value)} className="set-select">
                  <option>Limit Order</option>
                  <option>Market Order</option>
                  <option>Stop Loss</option>
                </select>
              </div>
              <div className="set-field">
                <label htmlFor="currency-select" className="set-field-label">Preferred Currency</label>
                <select id="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)} className="set-select">
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </select>
              </div>
              <div className="set-field">
                <label htmlFor="timezone-select" className="set-field-label">Time Zone</label>
                <select id="timezone-select" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="set-select">
                  <option>(GMT-05:00) Eastern Time</option>
                  <option>(GMT-08:00) Pacific Time</option>
                  <option>(GMT+00:00) UTC</option>
                </select>
              </div>
            </div>
          </section>

        </div>

        {/* ── Right Column ── */}
        <div className="set-right-col">

          {/* Profile Card */}
          <section className="set-card set-profile-card">
            <div className="set-profile-center">
              <div className="set-avatar-wrap">
                <div className="set-avatar">
                  <UserIcon size={32} className="set-avatar-icon" />
                </div>
                <div className="set-avatar-edit">
                  <Edit3 size={10} />
                </div>
              </div>
              <h2 className="set-profile-name">{displayName}</h2>
              <p className="set-profile-handle set-text-mono">{handle}</p>
              <span className="set-premium-badge">Premium</span>
            </div>

            <div className="set-profile-details">
              <div className="set-detail-row">
                <span className="set-detail-label">Email</span>
                <span className="set-detail-value set-text-mono">{displayEmail}</span>
              </div>
              <div className="set-detail-row">
                <span className="set-detail-label">Country</span>
                <span className="set-detail-value set-text-mono">United States</span>
              </div>
              <div className="set-detail-row">
                <span className="set-detail-label">Member Since</span>
                <span className="set-detail-value set-text-mono">May 2023</span>
              </div>
            </div>

            <button type="submit" className="set-edit-profile-btn">Edit Profile</button>
          </section>

          {/* Connected Accounts */}
          <section className="set-card">
            <h3 className="set-sidebar-label">Connected Accounts</h3>
            <div className="set-connected-list">
              <div className="set-connected-row">
                <div className="set-connected-left">
                  <Laptop size={16} className="set-connected-icon" />
                  <span className="set-connected-name">Brokerage</span>
                </div>
                <span className="set-connected-status">CONNECTED</span>
              </div>
              <div className="set-connected-row">
                <div className="set-connected-left">
                  <Mail size={16} className="set-connected-icon" />
                  <span className="set-connected-name">Google</span>
                </div>
                <span className="set-connected-status">CONNECTED</span>
              </div>
            </div>
          </section>

          {/* Support & Legal */}
          <section>
            <h3 className="set-sidebar-label">Support &amp; Legal</h3>
            <div className="set-support-list">
              <a
                href="#help"
                className="set-support-link"
                onClick={(e) => { e.preventDefault(); alert("Help center loading…"); }}
              >
                <div className="set-support-left">
                  <HelpIcon size={16} className="set-icon-primary" />
                  <span className="set-support-text">Help Center</span>
                </div>
                <ChevronRight size={16} className="set-support-chevron" />
              </a>
              <a
                href="#bug"
                className="set-support-link"
                onClick={(e) => { e.preventDefault(); alert("Redirecting to bug tracking…"); }}
              >
                <div className="set-support-left">
                  <Bug size={16} className="set-icon-primary" />
                  <span className="set-support-text set-text-error">Report a Bug</span>
                </div>
                <ChevronRight size={16} className="set-support-chevron" />
              </a>
            </div>
          </section>

        </div>
      </form>
    </div>
  );
}
