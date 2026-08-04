import { AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <Modal title={title} onClose={onCancel} maxWidth="400px" className="confirm-dialog">
          <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--r-sm)",
                background: variant === "danger" ? "var(--loss-subtle)" : "var(--warn-subtle)",
                border: `1px solid ${variant === "danger" ? "var(--loss-border)" : "var(--warn-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: variant === "danger" ? "var(--loss)" : "var(--warn)",
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={18} strokeWidth={2.5} />
            </div>
            <p className="confirm-description">{description}</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={`btn ${variant === "danger" ? "btn-danger" : "btn-ghost"}`}
              onClick={onConfirm}
              autoFocus
            >
              {confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
