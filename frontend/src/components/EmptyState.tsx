import { ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: string | ReactNode;
  title?: string;
  message: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      role="region"
      aria-label="Empty state"
    >
      {icon && (
        <div className="empty-icon-wrap" aria-hidden="true">
          {typeof icon === "string" ? (
            <span style={{ fontSize: "1.5rem" }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      {title && <p className="empty-title">{title}</p>}
      <p className="empty-description">{message}</p>
      {(action || secondaryAction) && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "0.5rem",
          }}
        >
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
