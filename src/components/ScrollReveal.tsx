import React, { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  staggerChildren?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 0.7,
  direction = 'up',
  staggerChildren = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const y = direction === 'up' ? 24 : direction === 'down' ? -24 : 0;
    const x = direction === 'left' ? 24 : direction === 'right' ? -24 : 0;

    const targets = staggerChildren && el.children.length > 0 ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        gsap.fromTo(
          targets,
          {
            opacity: 0,
            x,
            y,
            scale: 0.98,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            delay,
            stagger: staggerChildren ? 0.08 : 0,
            ease: 'power3.out',
          }
        );
      } else {
        const scroller = document.getElementById('main-content-scroll') || undefined;
        gsap.fromTo(
          targets,
          {
            opacity: 0,
            x,
            y,
            scale: 0.98,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            delay,
            stagger: staggerChildren ? 0.08 : 0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, [delay, duration, direction, staggerChildren]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
