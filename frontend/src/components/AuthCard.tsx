import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  error?: string | null;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, error, children }: AuthCardProps) {
  return (
    <div className="auth-card-container">
      <div className="auth-card-header">
        <h2 className="auth-card-title">{title}</h2>
        <p className="auth-card-subtitle">{subtitle}</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="auth-error-banner"
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Shield size={14} aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
