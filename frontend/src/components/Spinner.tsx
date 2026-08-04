interface SpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Spinner({ text = "Loading…", size = "md" }: SpinnerProps) {
  const dotSize: Record<string, string> = {
    sm: "5px",
    md: "7px",
    lg: "9px",
  };

  return (
    <div className="spinner-container" role="status" aria-label={text}>
      <div className="spinner-dots" aria-hidden="true">
        <div
          className="spinner-dot"
          style={{ width: dotSize[size], height: dotSize[size] }}
        />
        <div
          className="spinner-dot"
          style={{ width: dotSize[size], height: dotSize[size] }}
        />
        <div
          className="spinner-dot"
          style={{ width: dotSize[size], height: dotSize[size] }}
        />
      </div>
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}
