import React, { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

interface AnimatedNumberProps {
  value: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  from = 0,
  duration,
  delay = 0.25,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  // Dynamic duration so counter is clearly visible:
  // e.g. 1 to 5 takes ~0.9s, percentages take ~1.6s
  const computedDuration =
    duration ?? (value <= 5 ? 0.9 : value <= 20 ? 1.2 : 1.6);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Always start display at 'from' (typically 0)
    el.textContent = `${prefix}${from.toFixed(decimals)}${suffix}`;

    const counter = { val: from };

    const ctx = gsap.context(() => {
      const runTween = () => {
        gsap.to(counter, {
          val: value,
          duration: computedDuration,
          delay,
          ease: 'power2.out',
          onUpdate: () => {
            if (el) {
              el.textContent = `${prefix}${counter.val.toFixed(decimals)}${suffix}`;
            }
          },
        });
      };

      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        runTween();
      } else {
        const scroller = document.getElementById('main-content-scroll') || undefined;
        gsap.to(counter, {
          val: value,
          duration: computedDuration,
          ease: 'power2.out',
          onUpdate: () => {
            if (el) {
              el.textContent = `${prefix}${counter.val.toFixed(decimals)}${suffix}`;
            }
          },
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top 95%',
            toggleActions: 'play none none none',
            once: true,
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [value, from, computedDuration, delay, prefix, suffix, decimals]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}{from.toFixed(decimals)}{suffix}
    </span>
  );
};
