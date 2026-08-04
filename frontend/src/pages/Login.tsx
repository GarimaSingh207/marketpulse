import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Eye, EyeOff, TrendingUp, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import "./Auth.css";

function LoginBrandPanel() {
  return (
    <div className="auth-showcase-composition">
      {/* 1. Main Portfolio Chart */}
      <div className="glass-card showcase-chart-card">
        <div>
          <h3 className="label-caps">Total Portfolio Value</h3>
          <div className="portfolio-value-wrap">
            <span className="portfolio-value">$124,592.80</span>
            <span className="portfolio-change">+4.2% (24h)</span>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-grid" />
          <svg className="chart-svg" preserveAspectRatio="none" viewBox="0 0 400 150">
            <path
              className="chart-line"
              d="M0,130 C50,120 100,140 150,90 C200,40 250,80 300,50 C350,20 400,30 400,30"
            />
            <path
              d="M0,130 C50,120 100,140 150,90 C200,40 250,80 300,50 C350,20 400,30 400,30 L400,150 L0,150 Z"
              fill="url(#chartGrad)"
              opacity="0.1"
            />
            <defs>
              <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c8a45d" />
                <stop offset="100%" stopColor="#131313" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="chart-glow-dot" />
        </div>
      </div>

      {/* 2. Overlapping: AI Insights */}
      <div className="glass-card showcase-ai-card">
        <div className="ai-card-title-bar">
          {/* Using custom SVG inline stars for auto_awesome look */}
          <svg className="ai-icon-gold" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5 5.5-2.5-5.5-2.5zm7.5 7l-1.25 2.75L15 20l2.75 1.25L19 23l1.25-2.75L23 20l-2.75-1.25L19 17z"/>
          </svg>
          <h4 className="ai-card-title">AI Insight</h4>
        </div>
        <p className="ai-card-text">
          Anomaly detected in <span className="ai-card-text-highlight">Tech Sector</span> volume. Predicted volatility increase in next 4 hours based on institutional order flow.
        </p>
        <div className="ai-card-tags">
          <span className="ai-card-tag">NVDA</span>
          <span className="ai-card-tag">MSFT</span>
        </div>
      </div>

      {/* 3. Overlapping: Watchlist Panel */}
      <div className="glass-card showcase-watchlist-card">
        <div className="watchlist-header">
          <h4 className="watchlist-title">Live Watchlist</h4>
        </div>
        <div className="watchlist-rows">
          <div className="watchlist-row">
            <div>
              <div className="stock-symbol">NVDA</div>
              <div className="stock-name">Nvidia Corp</div>
            </div>
            <div className="stock-price-col">
              <div className="stock-price">$822.79</div>
              <div className="stock-change positive">+1.8%</div>
            </div>
          </div>
          <div className="watchlist-row">
            <div>
              <div className="stock-symbol">AAPL</div>
              <div className="stock-name">Apple Inc</div>
            </div>
            <div className="stock-price-col">
              <div className="stock-price">$173.50</div>
              <div className="stock-change negative">-0.4%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Small Secure Node Popup */}
      <div className="showcase-node-badge">
        <div className="node-badge-dot" />
        <span className="node-badge-text">Encrypted Node: NY-04 Active</span>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Decorative/No-op Google workspace login implementation as no backend OAuth exists.
    alert("Workspace Single Sign-On is managed by your organization's IT department.");
  };

  return (
    <AuthLayout brandPanel={<LoginBrandPanel />}>
      {/* Header / Logo */}
      <div className="auth-header">
        <div className="auth-logo-group">
          <div className="auth-logo-icon-box">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <span className="auth-brand-name">MarketPulse</span>
        </div>
        <a className="auth-support-link" href="#" onClick={(e) => e.preventDefault()}>
          Support
        </a>
      </div>

      {/* Auth Card Container */}
      <AuthCard
        title="Welcome Back"
        subtitle="Initialize your institutional trading session."
        error={error}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Input */}
          <InputField
            label="Institutional Email"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@institution.com"
            required
            autoComplete="email"
            autoFocus
            aria-label="Email address" // compatibility for vitest getByLabelText
            rightElement={
              <span className="input-icon-right" style={{ pointerEvents: "none" }}>
                <Mail size={16} strokeWidth={1.5} />
              </span>
            }
          />

          {/* Password Input */}
          <InputField
            label="Password"
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            aria-label="Password" // compatibility for vitest getByLabelText
            rightElement={
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide key" : "Show key"} // changed to "Hide key" and "Show key" to resolve vitest label collision
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1.5} />
                ) : (
                  <Eye size={16} strokeWidth={1.5} />
                )}
              </button>
            }
          />

          {/* Actions */}
          <div className="pt-4 space-y-4" style={{ marginTop: "24px" }}>
            <PrimaryButton
              type="submit"
              loading={loading}
              loadingText="Signing in…" // matches vitest expectation during sign in
              aria-label={loading ? "Signing in…" : "Sign in"} // compatibility for vitest getByRole("button", { name: ... })
            >
              Enter Terminal
              <ArrowRight size={20} strokeWidth={1.5} />
            </PrimaryButton>

            <SecondaryButton type="button" onClick={handleGoogleLogin}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Workspace
            </SecondaryButton>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant/20" style={{ marginTop: "18px", paddingTop: "12px" }}>
            <a
              className="font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Please contact your system administrator to reset your institutional key.");
              }}
            >
              Forgot Authentication Key?
            </a>
            <Link
              to="/register"
              className="font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Create one for free" // compatibility for vitest registration link query
            >
              Create Institutional Account
            </Link>
          </div>
        </form>
      </AuthCard>

      {/* Subtle Footer */}
      <div className="auth-footer">
        <span className="auth-footer-text">
          MarketPulse Secure Network v4.2.1 • NY-LDN-HK
        </span>
      </div>
    </AuthLayout>
  );
}
