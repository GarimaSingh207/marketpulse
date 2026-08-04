import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
  icon?: React.ReactNode;
  iconVariant?: "accent" | "profit" | "loss" | "warn";
  animateValue?: boolean;
}

function useAnimatedCounter(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const startTime = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;

      if (ref.current) {
        if (Number.isInteger(target)) {
          ref.current.textContent = Math.round(current).toString();
        } else {
          ref.current.textContent = current.toFixed(2);
        }
      }

      if (progress < 1) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return ref;
}

export default function StatCard({
  label,
  value,
  sub,
  valueClass = "",
  icon,
  iconVariant = "accent",
  animateValue = false,
}: StatCardProps) {
  const numericValue = typeof value === "number" ? value : NaN;
  const shouldAnimate = animateValue && !isNaN(numericValue);
  const counterRef = useAnimatedCounter(shouldAnimate ? numericValue : 0);

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {icon && (
        <div className={`stat-card-icon ${iconVariant}`} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="stat-label" aria-label={label}>
        {label}
      </div>
      <div
        className={`stat-value ${valueClass}`}
        role="text"
        aria-live="polite"
      >
        {shouldAnimate ? <span ref={counterRef}>0</span> : value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}
