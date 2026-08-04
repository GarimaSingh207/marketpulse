import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <motion.div
      className="error-banner"
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <AlertCircle
        size={15}
        className="error-banner-icon"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span>{message}</span>
    </motion.div>
  );
}
