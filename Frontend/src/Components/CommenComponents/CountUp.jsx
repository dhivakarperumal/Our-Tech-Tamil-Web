import { useEffect, useRef, useState } from "react";

function formatValue(value, decimals) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function CountUp({ value, suffix = "", decimals = 0, duration = 1600 }) {
  const elementRef = useRef(null);
  const [count, setCount] = useState(0);
  const formattedValue = formatValue(value, decimals);

  useEffect(() => {
    let frameId;
    let observer;
    let started = false;

    const animate = () => {
      if (started) return;
      started = true;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCount(value);
        return;
      }

      const startTime = performance.now();
      const updateCount = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        setCount(value * easedProgress);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(updateCount);
        } else {
          setCount(value);
        }
      };

      frameId = window.requestAnimationFrame(updateCount);
    };

    const element = elementRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      animate();
      return () => window.cancelAnimationFrame(frameId);
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(element);

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [duration, formattedValue, suffix, value]);

  return (
    <span
      ref={elementRef}
      aria-label={`${formattedValue}${suffix}`}
    >
      {formatValue(count, decimals)}
      {suffix}
    </span>
  );
}

export default CountUp;
