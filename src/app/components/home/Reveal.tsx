'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Milliseconds to stagger this element behind its neighbours. */
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article' | 'header';
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view, then stops observing.
 *
 * The animation itself lives in CSS (`[data-reveal]` in app.css), which is
 * also where `prefers-reduced-motion` disables it — so a reader who has asked
 * for less motion gets the finished layout immediately rather than a
 * JavaScript-driven approximation of it.
 */
export default function Reveal({ delay = 0, as = 'div', children, style, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Without IntersectionObserver (or in a test renderer) show immediately
    // rather than leaving the content invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(element);

    // Safety net. Content must never be permanently invisible because an
    // observer callback did not arrive — a mis-fire would silently blank an
    // entire section rather than merely skip its animation.
    const fallback = window.setTimeout(() => {
      setShown(true);
      observer.disconnect();
    }, 2500);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      data-reveal={shown ? 'shown' : ''}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
