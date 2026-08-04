import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, TrendingUp } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import "./Auth.css";

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; colorClass: string; label: string } {
  if (!pw) return { level: 0, colorClass: "", label: "" };
  if (pw.length < 6) {
    return { level: 1, colorClass: "weak", label: "Weak" };
  }
  if (pw.length < 10) {
    return { level: 2, colorClass: "fair", label: "Fair" };
  }
  return { level: 3, colorClass: "strong", label: "Strong" };
}

function RegisterBrandPanel() {
  return (
    <div className="auth-showcase-composition">
      {/* 1. Main Portfolio Chart */}
      <div className="glass-card showcase-chart-card">
        <div>
          <h3 className="label-caps">Portfolio Overview</h3>
          <div className="portfolio-value-wrap">
            <span className="portfolio-value">Investment Analytics</span>
          </div>
        </div>
        <div className="chart-container" style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "112px", marginTop: "24px" }}>
          <div className="chart-grid" />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", height: "100%", zIndex: 10, padding: "0 8px" }}>
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.4)", height: "40%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.5)", height: "35%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.3)", height: "50%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.7)", height: "45%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.6)", height: "65%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.8)", height: "55%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "rgba(200, 164, 93, 0.9)", height: "80%", borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: "8%", backgroundColor: "var(--auth-primary)", height: "95%", borderRadius: "2px 2px 0 0", boxShadow: "0 0 15px rgba(200,164,93,0.3)" }} />
          </div>
        </div>
      </div>

      {/* 2. AI Insights */}
      <div className="glass-card showcase-ai-card" style={{ marginTop: "-32px", zIndex: 20 }}>
        <div className="ai-card-title-bar">
          <svg className="ai-icon-gold" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5 5.5-2.5-5.5-2.5zm7.5 7l-1.25 2.75L15 20l2.75 1.25L19 23l1.25-2.75L23 20l-2.75-1.25L19 17z" />
          </svg>
          <h4 className="ai-card-title">AI Intel</h4>
        </div>
        <p className="ai-card-text">
          Unusual options volume detected in semiconductor sector preceding earnings.
        </p>
      </div>

      {/* 3. Watchlist Action */}
      <div className="glass-card showcase-watchlist-card">
        <div className="watchlist-header">
          <h4 className="watchlist-title">Watchlist Action</h4>
        </div>
        <div className="watchlist-rows">
          <div className="watchlist-row">
            <div>
              <div className="stock-symbol">NVDA</div>
              <div className="stock-name">Nvidia Corp</div>
            </div>
            <div className="stock-price-col">
              <div className="stock-price">$822.79</div>
              <div className="stock-change positive">+4.2%</div>
            </div>
          </div>
          <div className="watchlist-row">
            <div>
              <div className="stock-symbol">AAPL</div>
              <div className="stock-name">Apple Inc</div>
            </div>
            <div className="stock-price-col">
              <div className="stock-price">$173.50</div>
              <div className="stock-change negative">-0.8%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!name.trim()) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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

  const handleGoogleAuth = () => {
    alert("Workspace Single Sign-On is managed by your organization's IT department.");
  };

  // Render password strength indicator bar under the password field
  const renderStrengthBar = () => {
    if (!password) return null;
    return (
      <div>
        <div className="auth-strength-container" aria-label={`Password strength: ${strength.label}`}>
          <div className={`auth-strength-bar ${strength.level >= 1 ? strength.colorClass : ""}`} />
          <div className={`auth-strength-bar ${strength.level >= 2 ? strength.colorClass : ""}`} />
          <div className={`auth-strength-bar ${strength.level >= 3 ? strength.colorClass : ""}`} />
        </div>
        {strength.label && (
          <p className={`auth-strength-label ${strength.colorClass}`}>
            {strength.label} password
          </p>
        )}
      </div>
    );
  };

  const passwordVisibilityToggle = (
    <button
      type="button"
      className="input-icon-right"
      onClick={() => setShowPassword((p) => !p)}
      aria-label={showPassword ? "Hide key" : "Show key"}
      tabIndex={-1}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  const confirmPasswordVisibilityToggle = (
    <button
      type="button"
      className="input-icon-right"
      onClick={() => setShowConfirmPassword((p) => !p)}
      aria-label={showConfirmPassword ? "Hide key" : "Show key"}
      tabIndex={-1}
    >
      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <AuthLayout brandPanel={<RegisterBrandPanel />}>
      {/* Header / Logo */}
      <div className="auth-header">
        <div className="auth-logo-group">
          <div className="auth-logo-icon-box">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <span className="auth-brand-name">MarketPulse</span>
        </div>
      </div>

      <AuthCard
        title="Welcome to MarketPulse"
        subtitle="Create your institutional trading account to access portfolio analytics, market intelligence, and professional investment tools."
        error={error}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <InputField
            id="reg-name"
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User size={20} />}
            required
            autoComplete="name"
            autoFocus
          />

          {/* Email Address */}
          <InputField
            id="reg-email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
            required
            autoComplete="email"
          />

          {/* Password */}
          <InputField
            id="reg-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={20} />}
            rightElement={passwordVisibilityToggle}
            bottomContent={renderStrengthBar()}
            required
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <InputField
            id="reg-confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock size={20} />}
            rightElement={confirmPasswordVisibilityToggle}
            required
            autoComplete="new-password"
          />

          <PrimaryButton type="submit" loading={loading} loadingText="Creating account…">
            Create Account
          </PrimaryButton>

          <div className="auth-divider-container">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Or</span>
            <div className="auth-divider-line" />
          </div>

          <SecondaryButton type="button" onClick={handleGoogleAuth}>
            <svg className="auth-google-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Continue with Google Workspace
          </SecondaryButton>
        </form>

        <div className="auth-card-footer">
          <p className="auth-card-footer-text">
            Already have an account?
            <Link to="/login" className="auth-card-footer-link">
              Sign In
            </Link>
          </p>
          <p className="auth-policy-text">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
