import React from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  brandPanel: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({ brandPanel, children }: AuthLayoutProps) {
  return (
    <div className="auth-layout-container">
      {/* LEFT SIDE: Product Showcase (Hidden on Mobile) */}
      <motion.div
        className="auth-showcase-container"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {brandPanel}
      </motion.div>

      {/* RIGHT SIDE: Authentication Hub */}
      <motion.div
        className="auth-hub-container"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
