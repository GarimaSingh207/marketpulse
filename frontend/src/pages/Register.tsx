import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, BarChart2, TrendingUp, Shield, Zap } from "lucide-react";

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { level: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

const strengthClass = ["", "weak", "fair", "good", "strong"];

const features = [
  { icon: TrendingUp, text: "Real-time market data & live stock prices" },
  { icon: BarChart2,  text: "Portfolio analytics with gain/loss tracking" },
  { icon: Eye,        text: "Custom watchlists for favorite assets" },
  { icon: Zap,        text: "Instant socket updates across devices" },
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Brand Panel ────────────────────────────────────────────── */}
      <motion.div
        className="auth-panel-brand"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-brand-logo">
          <div className="auth-brand-icon" aria-hidden="true">
            <BarChart2 size={20} color="white" strokeWidth={2.5} />
          </div>
          <span className="auth-brand-name">MarketPulse</span>
        </div>

        <div className="auth-brand-content">
          <h1 className="auth-brand-headline">
            Start investing<br />
            <span>with confidence.</span>
          </h1>
          <p className="auth-brand-description">
            Join thousands of investors using MarketPulse to track, analyze, and grow their portfolios.
          </p>
          <div className="auth-features">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                className="auth-feature"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="auth-feature-icon" aria-hidden="true">
                  <Icon size={13} strokeWidth={2.5} />
                </div>
                <span>{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="auth-stats" aria-hidden="true">
          <div className="auth-stat-item">
            <span className="auth-stat-number">Free</span>
            <span className="auth-stat-label">Always free</span>
          </div>
          <div className="auth-stat-item">
            <span className="auth-stat-number">∞</span>
            <span className="auth-stat-label">Portfolios</span>
          </div>
          <div className="auth-stat-item">
            <span className="auth-stat-number">Live</span>
            <span className="auth-stat-label">Market data</span>
          </div>
        </div>
      </motion.div>

      {/* ── Form Panel ─────────────────────────────────────────────── */}
      <motion.div
        className="auth-panel-form"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-subtitle">Get started with MarketPulse for free</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error-banner"
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: "1.25rem", overflow: "hidden" }}
              >
                <Shield size={14} aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full name
              </label>
              <div className="form-input-wrap">
                <User size={14} className="form-input-icon" aria-hidden="true" />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input has-icon-left"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email address
              </label>
              <div className="form-input-wrap">
                <Mail size={14} className="form-input-icon" aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  className="form-input has-icon-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <div className="form-input-wrap">
                <Lock size={14} className="form-input-icon" aria-hidden="true" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input has-icon-left has-icon-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-input-icon-right"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={14} strokeWidth={2} />
                  ) : (
                    <Eye size={14} strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* Strength indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="strength-bar-wrap" aria-label={`Password strength: ${strength.label}`}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`strength-bar ${
                          i <= strength.level ? strengthClass[strength.level] : ""
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`strength-label ${strengthClass[strength.level]}`}>
                      {strength.label} password
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "1.25rem" }}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                    aria-hidden="true"
                  />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </motion.button>
          </form>

          <p className="auth-form-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
