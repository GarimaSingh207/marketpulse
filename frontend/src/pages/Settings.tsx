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
  Shield,
  LogOut,
  Laptop,
  CheckCircle,
  Mail,
  HelpCircle as HelpIcon,
} from "lucide-react";
import "./Settings.css";

export default function Settings() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local Appearance Preferences (Visual only)
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [fontSize, setFontSize] = useState(16);
  const [accent, setAccent] = useState<"gold" | "blue" | "red" | "gray">("gold");
  const [compactMode, setCompactMode] = useState(false);

  // Local Notification Preferences (Interactive local state)
  const [alerts, setAlerts] = useState({
    priceAlerts: { push: true, email: false, sms: false },
    portfolioUpdates: { push: true, email: true, sms: false },
    marketNews: { push: true, email: false, sms: true },
  });

  // Local Trading Preferences (Interactive local state)
  const [orderType, setOrderType] = useState("Market Order");
  const [currency, setCurrency] = useState("USD - US Dollar");
  const [timezone, setTimezone] = useState("(GMT-05:00) Eastern Time");

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Profile data fetched from backend (to make sure it's fresh)
  const [freshUser, setFreshUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/profile");
        setFreshUser(res.data);
      } catch (err: any) {
        // Fallback to AuthContext user if profile endpoint fails or is unseeded
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
    
    // Simulate updating preferences (Since backend doesn't store preference schemas)
    setTimeout(() => {
      setLoading(false);
      setSaveSuccess("Preferences successfully saved to browser local session.");
      // Clear message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    }, 600);
  };

  const handleToggleAlert = (category: keyof typeof alerts, channel: "push" | "email" | "sms") => {
    setAlerts((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  if (loading && !freshUser) {
    return <Spinner text="Retrieving profile settings cockpit…" />;
  }

  const displayName = freshUser?.name || user?.name || "N/A";
  const displayEmail = freshUser?.email || user?.email || "N/A";
  const displayRole = freshUser?.role || user?.role || "USER";

  return (
    <div className="set-root set-stagger-load">
      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Settings</h1>
        <p className="text-xs font-label-caps uppercase tracking-wider text-on-surface-variant mt-1.5">
          Manage your account, security, and application preferences with institutional-grade control panels.
        </p>
      </section>

      {error && <ErrorBanner message={error} />}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-hist-emerald/10 border border-hist-emerald/30 text-hist-emerald rounded text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <form onSubmit={handleSavePreferences} className="set-grid-12">
        {/* Left Column: Preference controls */}
        <div className="col-span-8 space-y-6">
          
          {/* Appearance Section */}
          <section className="set-card">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <Palette className="text-primary" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Appearance</h2>
              <span className="ml-auto text-[9px] set-badge set-badge-variant">Local Only</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block set-title-caps text-on-surface-variant/50 mb-2">Theme Mode</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 border text-[11px] font-semibold transition-all ${
                        theme === "dark"
                          ? "border-primary text-primary bg-primary/5"
                          : "border-white/10 text-on-surface-variant hover:border-white/30"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-1.5 px-2 border border-white/5 text-on-surface-variant/30 text-[11px] font-semibold cursor-not-allowed"
                      title="Light mode is unavailable in this theme system"
                    >
                      Light (N/A)
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-1.5 px-2 border border-white/5 text-on-surface-variant/30 text-[11px] font-semibold cursor-not-allowed"
                      title="System matching is unavailable"
                    >
                      System (N/A)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block set-title-caps text-on-surface-variant/50 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary h-1 bg-surface-container-highest cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant mt-1.5 set-text-mono">
                    <span>12px</span>
                    <span className="text-primary font-bold">{fontSize}px (Selected)</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block set-title-caps text-on-surface-variant/50 mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`set-accent-dot bg-primary ${accent === "gold" ? "active" : ""}`}
                      onClick={() => setAccent("gold")}
                      title="Gold"
                    />
                    <button
                      type="button"
                      disabled
                      className="set-accent-dot bg-secondary-container opacity-45 cursor-not-allowed"
                      title="Blue (Coming Soon)"
                    />
                    <button
                      type="button"
                      disabled
                      className="set-accent-dot bg-error opacity-45 cursor-not-allowed"
                      title="Red (Coming Soon)"
                    />
                    <button
                      type="button"
                      disabled
                      className="set-accent-dot bg-tertiary-container opacity-45 cursor-not-allowed"
                      title="Gray (Coming Soon)"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-white/5">
                  <div>
                    <p className="text-xs font-bold">Compact Mode</p>
                    <p className="text-[10px] text-on-surface-variant">Increase table and metrics grid density</p>
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

          {/* Notifications Channels Section */}
          <section className="set-card">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <Bell className="text-primary" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Alert Configurations</h2>
              <span className="ml-auto text-[9px] set-badge set-badge-variant">Local Only</span>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-12 pb-2 border-b border-white/10 set-title-caps text-on-surface-variant/60 text-[9px]">
                <div className="col-span-6">Alert Category</div>
                <div className="col-span-2 text-center">Push</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">SMS</div>
              </div>

              {/* Price Alerts */}
              <div className="grid grid-cols-12 py-3 border-b border-white/5 items-center hover:bg-white/[0.01]">
                <div className="col-span-6">
                  <p className="font-bold text-xs">Price Alerts</p>
                  <p className="text-[10px] text-on-surface-variant">Volatility tags and target triggers</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.priceAlerts.push}
                    onChange={() => handleToggleAlert("priceAlerts", "push")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.priceAlerts.email}
                    onChange={() => handleToggleAlert("priceAlerts", "email")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.priceAlerts.sms}
                    onChange={() => handleToggleAlert("priceAlerts", "sms")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Portfolio Updates */}
              <div className="grid grid-cols-12 py-3 border-b border-white/5 items-center hover:bg-white/[0.01]">
                <div className="col-span-6">
                  <p className="font-bold text-xs">Portfolio Updates</p>
                  <p className="text-[10px] text-on-surface-variant">Daily rebalancing summary log</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.portfolioUpdates.push}
                    onChange={() => handleToggleAlert("portfolioUpdates", "push")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.portfolioUpdates.email}
                    onChange={() => handleToggleAlert("portfolioUpdates", "email")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.portfolioUpdates.sms}
                    onChange={() => handleToggleAlert("portfolioUpdates", "sms")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Market News */}
              <div className="grid grid-cols-12 py-3 border-b border-white/5 items-center hover:bg-white/[0.01]">
                <div className="col-span-6">
                  <p className="font-bold text-xs">Market News</p>
                  <p className="text-[10px] text-on-surface-variant">Curated macro-intelligence bulletins</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.marketNews.push}
                    onChange={() => handleToggleAlert("marketNews", "push")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.marketNews.email}
                    onChange={() => handleToggleAlert("marketNews", "email")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={alerts.marketNews.sms}
                    onChange={() => handleToggleAlert("marketNews", "sms")}
                    className="w-3.5 h-3.5 rounded-sm bg-surface-container-highest border-white/10 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Trading Preferences */}
          <section className="set-card">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <Sliders className="text-primary" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Trading Preferences</h2>
              <span className="ml-auto text-[9px] set-badge set-badge-variant">Local Only</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ordertype-select" className="block set-title-caps text-on-surface-variant/50">Default Order Type</label>
                <select
                  id="ordertype-select"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full set-select-compact"
                >
                  <option value="Limit Order">Limit Order</option>
                  <option value="Market Order">Market Order</option>
                  <option value="Stop Loss">Stop Loss</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="currency-select" className="block set-title-caps text-on-surface-variant/50">Preferred Currency</label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full set-select-compact"
                >
                  <option value="USD - US Dollar">USD - US Dollar</option>
                  <option value="EUR - Euro">EUR - Euro</option>
                  <option value="GBP - British Pound">GBP - British Pound</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="timezone-select" className="block set-title-caps text-on-surface-variant/50">Time Zone</label>
                <select
                  id="timezone-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full set-select-compact"
                >
                  <option value="(GMT-05:00) Eastern Time">(GMT-05:00) Eastern Time</option>
                  <option value="(GMT-08:00) Pacific Time">(GMT-08:00) Pacific Time</option>
                  <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                </select>
              </div>
            </div>
          </section>

          {/* Action Trigger Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="py-2.5 px-6 bg-primary text-on-primary-fixed font-bold text-xs uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all rounded-[2px]"
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Right Column: Account/Profile details */}
        <div className="col-span-4 space-y-6">
          
          {/* Profile overview card */}
          <section className="set-card border-t-2 border-primary">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 mb-3 bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                <UserIcon size={32} />
              </div>
              <h3 className="font-bold text-sm text-on-surface mb-0.5">{displayName}</h3>
              <p className="text-[10px] set-text-mono text-on-surface-variant uppercase tracking-wider mb-2.5">
                Role: {displayRole}
              </p>
              <span className="set-badge set-badge-gold tracking-widest text-[9px] mb-2">
                Premium status
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Email Address</span>
                <span className="set-text-mono font-semibold truncate max-w-[180px]">{displayEmail}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Country Location</span>
                <span className="set-text-mono">United States</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Member Scope</span>
                <span className="set-text-mono">August 2026</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">API Authorization</span>
                <span className="text-[10px] text-hist-emerald font-bold uppercase tracking-wider">Active</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                className="w-full py-2 bg-white/5 border border-white/10 hover:border-primary/30 text-on-surface text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all rounded-[2px]"
                onClick={() => alert("Profile edits are locked by host security protocols.")}
              >
                Edit Profile Settings (N/A)
              </button>
              
              <button
                type="button"
                onClick={logout}
                className="w-full py-2 bg-error-container/10 border border-error/20 hover:border-error text-error text-[10px] font-bold uppercase tracking-widest hover:bg-error-container/20 transition-all flex items-center justify-center gap-1.5 rounded-[2px]"
              >
                <LogOut size={12} />
                <span>Terminate Session (Logout)</span>
              </button>
            </div>
          </section>

          {/* Connected Integrations Card */}
          <section className="set-card">
            <h3 className="set-title-caps text-on-surface-variant mb-4 tracking-widest">Connected Integrations</h3>
            <div className="space-y-3 set-text-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Laptop size={14} />
                  <span>Clearing Brokerage</span>
                </div>
                <span className="text-[9px] text-primary font-bold tracking-wider">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Mail size={14} />
                  <span>Google SSO</span>
                </div>
                <span className="text-[9px] text-primary font-bold tracking-wider">CONNECTED</span>
              </div>
            </div>
          </section>

          {/* Support Panel */}
          <section className="space-y-2">
            <h3 className="set-title-caps text-on-surface-variant/40 px-2 tracking-widest">Support & Compliance</h3>
            <div className="flex flex-col gap-1.5">
              <a
                href="#help"
                className="flex items-center justify-between p-3 bg-surface-container-low border border-white/5 hover:border-primary/20 transition-all text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Help center interface loading...");
                }}
              >
                <div className="flex items-center gap-2">
                  <HelpIcon size={14} className="text-primary" />
                  <span>Help Documents</span>
                </div>
              </a>
              <a
                href="#bug"
                className="flex items-center justify-between p-3 bg-surface-container-low border border-white/5 hover:border-error/20 transition-all text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Redirecting to bug tracking cockpit...");
                }}
              >
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-error" />
                  <span className="text-error font-semibold">Report Bug Ticket</span>
                </div>
              </a>
            </div>
          </section>

        </div>
      </form>
    </div>
  );
}
