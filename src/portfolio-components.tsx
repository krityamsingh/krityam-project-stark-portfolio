import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { profile } from './portfolio-data';

const animatedTags = {
  div: motion.create('div'),
  nav: motion.create('nav'),
  h1: motion.create('h1'),
  h2: motion.create('h2'),
  li: motion.create('li'),
};

type FadeInProps = {
  as?: keyof typeof animatedTags;
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
};

export function FadeIn({ as = 'div', children, className, delay = 0, duration = 0.7, x = 0, y = 30 }: FadeInProps) {
  const Tag = animatedTags[as];
  const reduced = useReducedMotion();

  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay: reduced ? 0 : delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  );
}

function Magnet({ children, padding = 24, strength = 6 }: { children: ReactNode; padding?: number; strength?: number }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const magnet = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const outer = anchor.current;
    const inner = magnet.current;
    if (!outer || !inner || reduced) return;

    function follow(event: PointerEvent) {
      if (!outer || !inner || event.pointerType !== 'mouse') return;
      const box = outer.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      const close = Math.abs(x) <= box.width / 2 + padding && Math.abs(y) <= box.height / 2 + padding;

      inner.style.transition = close ? 'transform 0.3s ease-out' : 'transform 0.6s ease-in-out';
      inner.style.transform = close ? `translate3d(${x / strength}px, ${y / strength}px, 0)` : '';
    }

    window.addEventListener('pointermove', follow, { passive: true });
    return () => window.removeEventListener('pointermove', follow);
  }, [padding, reduced, strength]);

  return (
    <span className="inline-flex" ref={anchor}>
      <span className="inline-flex will-change-transform" ref={magnet}>{children}</span>
    </span>
  );
}

export function ContactButton() {
  return (
    <Magnet>
      <a
        className="contact-button inline-flex whitespace-nowrap rounded-full px-8 py-3 text-xs font-medium uppercase tracking-widest text-white sm:px-10 sm:py-3.5 sm:text-sm md:px-12 md:py-4 md:text-base"
        href={`mailto:${profile.email}`}
        data-portrait-contact
      >
        Contact Me
      </a>
    </Magnet>
  );
}

function Character({ character, progress, index, count }: {
  character: string;
  progress: MotionValue<number>;
  index: number;
  count: number;
}) {
  const opacity = useTransform(progress, [index / count, (index + 1) / count], [0.2, 1]);

  return (
    <span className="relative inline-block">
      <span className="invisible">{character}</span>
      <motion.span className="absolute inset-0" style={{ opacity }}>{character}</motion.span>
    </span>
  );
}

export function AnimatedText({ children, className }: { children: string; className?: string }) {
  const paragraph = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: paragraph,
    offset: ['start 0.8', 'end 0.2'],
  });

  let first = 0;
  const words = children.split(' ');

  return (
    <p ref={paragraph} className={className}>
      {reduced ? children : <>
        <span className="sr-only">{children}</span>
        <span aria-hidden="true">
          {words.map((word, wordIndex) => {
            const offset = first;
            first += word.length + 1;
            return (
              <span key={offset}>
                <span className="inline-block whitespace-nowrap">
                  {Array.from(word, (character, i) => (
                    <Character key={i} character={character} index={offset + i} count={children.length} progress={scrollYProgress} />
                  ))}
                </span>
                {wordIndex < words.length - 1 ? ' ' : null}
              </span>
            );
          })}
        </span>
      </>}
    </p>
  );
}
