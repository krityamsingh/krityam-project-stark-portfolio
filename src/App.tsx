import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import ForgeInterlude from './ForgeInterlude';
import { projects, type PortfolioProject } from './projects';

function useEntranceAnimations() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -50px 0px', threshold: .08 });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function Navigation() {
  const [open, setOpen] = useState(false);
  return <header className="nav-wrap">
    <a className="nav-logo" href="#home" onClick={() => setOpen(false)}>
      <span className="logo-mark">K<span>✦</span>S</span>
      <span className="logo-sub">PROJECT STARK</span>
    </a>
    <nav className={'nav-pill' + (open ? ' nav-open' : '')} aria-label="Primary navigation">
      <a onClick={() => setOpen(false)} href="#home">HOME</a>
      <a onClick={() => setOpen(false)} href="#projects">PROJECTS</a>
      <a onClick={() => setOpen(false)} href="#about">ABOUT</a>
      <a onClick={() => setOpen(false)} href="#contact">CONTACT</a>
    </nav>
    <a className="nav-action" href="mailto:krityamsingh100@gmail.com"><span className="status-dot" /> AVAILABLE TO COLLABORATE <b>↗</b></a>
    <button className="menu-toggle" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? 'CLOSE' : 'MENU'} <span>{open ? '×' : '☰'}</span></button>
  </header>;
}

function CursorAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    let frame = 0;
    const move = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${event.clientX - 240}px,${event.clientY - 240}px,0)`;
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(frame); };
  }, []);
  return <div className="cursor-atmosphere" ref={ref} aria-hidden="true" />;
}

function ProgressMeter() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const render = () => {
      raf = 0;
      if (bar.current) {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        bar.current.style.transform = `scaleX(${limit > 0 ? window.scrollY / limit : 0})`;
      }
    };
    const update = () => { if (!raf) raf = requestAnimationFrame(render); };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    render();
    return () => {window.removeEventListener('scroll',update);window.removeEventListener('resize',update);cancelAnimationFrame(raf);};
  }, []);
  return <div ref={bar} className="scroll-meter" />;
}

function Hero() {
  const section = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const preload = (src: string) => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
    Promise.all([preload('/landing-crossed.webp'), preload('/landing-open.webp')])
      .then(() => { if (active) setReady(true); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const el = section.current;
    if (!el || !ready) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const stage = el.firstElementChild as HTMLElement | null;
      if (!stage) return;
      const distance = Math.max(1, el.offsetHeight - stage.offsetHeight);
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / distance));
      const t = Math.min(1, Math.max(0, (p - .08) / .76));
      el.style.setProperty('--pose-progress', String(t * t * (3 - 2 * t)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [ready]);
  return <section ref={section} className={'landing-poster' + (ready ? ' landing-poster--motion' : '')} id="home" aria-label="Krityam Singh — portfolio">
    {ready ? <div className="landing-pose-stage">
      <h1 className="landing-visually-hidden">Krityam Singh</h1>
      <img className="landing-pose-closed" src="/landing-crossed.webp" alt="Krityam Singh in a dark suit with crossed arms" fetchPriority="high" />
      <img className="landing-pose-open" src="/landing-open.webp" alt="" aria-hidden="true" />
    </div> : <><h1 className="landing-visually-hidden">Krityam Singh</h1><img src="/landing-poster.webp" alt="Krityam Singh — portrait poster" fetchPriority="high" /></>}
  </section>;
}

function SignalStrip() {
  return <div className="signal-strip" aria-label="Areas of practice">
    <div className="signal-track">
      {Array.from({length:4}, (_,i) => <span key={i}>AI ENGINEERING <b>✦</b> WEB DEVELOPMENT <b>✦</b> AUTOMATION <b>✦</b> CINEMATIC EXPERIENCES <b>✦</b></span>)}
    </div>
  </div>;
}

function MediaDisplay({project:p}: {project:PortfolioProject}) {
  const [muted, setMuted] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const [hasError,setHasError] = useState(false);
  useEffect(() => {
    const player = video.current;
    if (!player || !p.video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) player.play().catch(() => {});
      else player.pause();
    }, {threshold:.35});
    observer.observe(player);
    return () => observer.disconnect();
  }, [p.video]);
  return <div className="project-screen" style={{'--accent':p.color} as CSSProperties}>
    <span className="project-screen-top">✦ / VISUAL ARCHIVE <span>MODULE {p.number}</span></span>
    {p.video && !hasError ? <><video ref={video} src={p.video} poster={p.poster} muted={muted} loop playsInline preload="metadata" onError={() => setHasError(true)} /><button className="sound-toggle" onClick={()=>setMuted(!muted)}>{muted?'ENABLE SOUND':'MUTE'}</button></> :
      <div className="project-construct" aria-label={p.title + ' conceptual visual'}>
        <span className="project-grid" />
        <div className="construct-ring ring-outer" /><div className="construct-ring ring-inner" />
        <strong className="construct-mark">{p.symbol}</strong>
        <span className="construct-satellite satellite-one" /><span className="construct-satellite satellite-two" />
        <div className="construct-desc">CONCEPTUAL / VISUAL REPRESENTATION</div>
      </div>}
    <span className="project-screen-bottom">SYSTEM ONLINE <span>FRAME / 0{p.number}</span></span>
  </div>;
}

function ProjectCase({p,index}: {p:PortfolioProject;index:number}) {
  const [details,setDetails]=useState(false);
  const layer=useRef<HTMLDivElement>(null);
  function move(event:PointerEvent<HTMLDivElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const element=layer.current; if(!element) return;
    const rect=element.getBoundingClientRect();
    const x=(event.clientX - rect.left)/rect.width-.5;
    const y=(event.clientY - rect.top)/rect.height-.5;
    element.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
  }
  function reset() { if(layer.current)layer.current.style.transform=''; }
  return <article className={'case-study'+(index%2?' case-alt':'')} data-reveal>
    <div className="case-info">
      <span className="case-index">[ {p.number} / 0{projects.length} ] <i /> {p.category}</span>
      <h3>{p.title}</h3><span className="case-sub">{p.subtitle}</span>
      <p>{p.summary}</p>
      <div className="stack">{p.stack.map(s=><span key={s}>{s}</span>)}</div>
      <div className="case-actions">
        <button onClick={()=>setDetails(!details)} aria-expanded={details}>{details?'CLOSE DETAILS −':'EXPLORE PROJECT ↗'}</button>
        {p.repo&&<a href={p.repo} target="_blank" rel="noreferrer">SOURCE ↗</a>}
        {p.site&&<a href={p.site} target="_blank" rel="noreferrer">VISIT ↗</a>}
      </div>
      {details && <div className="expanded-details">{p.details}</div>}
      <div className="case-foot"><span className="live-indicator" /> {p.status}</div>
    </div>
    <div ref={layer} className="case-media" onPointerMove={move} onPointerLeave={reset}>
      <MediaDisplay project={p} />
      <div className="glass-glint"/>
    </div>
  </article>;
}

function Manifesto() {
  return <section className="manifesto" id="about">
    <div className="manifesto-num" data-reveal>02 <span>/ THE BUILDER</span></div>
    <div className="manifesto-inner">
      <div className="manifesto-heading" data-reveal><span className="eyebrow">A CREATIVE ENGINEER</span><h2>NOT JUST<br/><em>IMAGINATION.</em><br/>EXECUTION.</h2></div>
      <div className="manifesto-right" data-reveal><div className="glass-sigil">✦</div><p>I'm Krityam Singh, a computer science student focusing on artificial intelligence, machine learning, and software engineering.</p><p>I like turning experiments into systems—from real-time communication platforms to AI-assisted video editing and autonomous agents.</p><a className="underline-link" href="https://github.com/krityamsingh" target="_blank" rel="noreferrer">EXPLORE MY GITHUB <span>↗</span></a></div>
    </div>
  </section>;
}

export default function App() {
  useEntranceAnimations();
  return <><ProgressMeter/><CursorAtmosphere/><Navigation/><main>
    <Hero/>
    <SignalStrip/>
    <ForgeInterlude/>
    <section className="projects-section" id="projects">
      <div className="projects-heading" data-reveal><div className="section-label">01 / ARCHIVE OF CREATIONS <span>2026—PRESENT</span></div>
        <h2>THE WORK<br/><em>BEHIND THE WORLD.</em></h2>
        <p>Not just an idea board. Explore selected systems, prototypes and creative work. Every project has its own story.</p>
      </div>
      <div className="cases">{projects.map((p,index)=><ProjectCase key={p.number} p={p} index={index}/>)}</div>
    </section>
    <Manifesto/>
    <section id="contact" className="closing"><span className="eyebrow" data-reveal>03 / OPEN CHANNEL</span><div data-reveal><h2>THE NEXT<br/><em>BIG THING</em><br/>STARTS HERE.</h2><a className="closing-cta" href="mailto:krityamsingh100@gmail.com">LET'S CONNECT <span>↗</span></a></div><div className="closing-base"><span>KRITYAM SINGH / PROJECT STARK</span><span><a href="https://github.com/krityamsingh" target="_blank" rel="noreferrer">GITHUB ↗</a></span><a href="#home">BACK TO TOP ↑</a></div></section>
  </main></>;
}