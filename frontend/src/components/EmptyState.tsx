interface Props {
  icon?: string;
  message: string;
}

export default function EmptyState({ icon = "📭", message }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-text">{message}</p>
    </div>
  );
}
