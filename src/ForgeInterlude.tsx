import { useEffect, useRef, useState } from 'react';

const VIDEO_URL = '/media/stark-forging.mp4';
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A scroll-synchronized film interlude between the hero and engineering projects.
 * Video is never presented as a recording of the author's own projects.
 * Supply a licensed copy of the clip in public/media/stark-forging.mp4.
 */
export default function ForgeInterlude() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener?.('change', syncMotion);
    return () => query.removeEventListener?.('change', syncMotion);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section) return;
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const travel = Math.max(1, section.offsetHeight - window.innerHeight);
        const position = clamp(-section.getBoundingClientRect().top / travel);
        setProgress(prev => Math.abs(position - prev) > .003 ? position : prev);
        if (video && mediaReady && !reducedMotion && video.duration && Number.isFinite(video.duration)) {
          const target = Math.min(video.duration - 0.05, position * video.duration);
          if (Math.abs(video.currentTime - target) > .13) video.currentTime = target;
        }
      });
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [mediaReady, reducedMotion]);

  const caption = progress < .33
    ? ['THE WORK BEGINS', 'Every system starts with an idea.']
    : progress < .7
      ? ['FORGED THROUGH ITERATION', 'Built, tested, refined.']
      : ['THE BUILD CONTINUES', 'Discover the projects below.'];

  return (
    <section
      ref={sectionRef}
      id="forge"
      className={'forge-interlude' + (reducedMotion ? ' forge-reduced-motion' : '')}
      aria-label="Cinematic inspiration: an Iron Man helmet being forged"
    >
      <div className="forge-sticky">
        <div className="forge-fallback" aria-hidden="true" />
        <video
          ref={videoRef}
          className={'forge-film' + (mediaReady ? ' forge-film-ready' : '')}
          src={VIDEO_URL}
          preload="auto"
          playsInline
          muted
          poster="/media/stark-forging-poster.jpg"
          aria-label="Iron Man helmet forging sequence from the film, used as a creative reference"
          onLoadedMetadata={() => setMediaReady(true)}
          onError={() => setMediaError(true)}
        />
        <div className="forge-vignette" />
        <div className="forge-topline">
          <span>PROJECT STARK // CREATIVE INSPIRATION</span>
          <span>THE FORGE / 001</span>
        </div>
        <div className="forge-content" aria-live="off">
          <p className="forge-kicker">THE MINDSET BEHIND THE BUILD</p>
          <h2>{caption[0]}</h2>
          <p>{caption[1]}</p>
          <a href="#projects" className="forge-jump">ENTER PROJECTS ↘</a>
        </div>
        <div className="forge-bottom">
          <span>{reducedMotion ? 'MOTION REDUCED' : 'SCROLL TO EXPLORE THE FORGE'}</span>
          <div className="forge-progress-track"><div className="forge-progress-bar" style={{ width: (progress * 100) + '%' }} /></div>
          <span>{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
        </div>
        {mediaError && <div className="forge-media-note">FILM CLIP AWAITING MEDIA UPLOAD</div>}
        <span className="forge-credit">IRON MAN (2008) FILM CLIP — CREATIVE REFERENCE; NOT ORIGINAL PROJECT FOOTAGE</span>
      </div>
    </section>
  );
}
