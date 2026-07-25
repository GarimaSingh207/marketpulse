import { ReactNode } from "react";

interface Props {
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ onClose, title, children }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
