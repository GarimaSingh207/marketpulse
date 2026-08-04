import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
}

export default function PrimaryButton({
  children,
  loading,
  loadingText = "Loading...",
  className = "",
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`auth-btn-primary ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="auth-btn-loading-content">
          <span className="auth-btn-spinner" aria-hidden="true" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
