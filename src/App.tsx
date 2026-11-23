import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import ForgeInterlude from './ForgeInterlude';
import { projects, type PortfolioProject } from './projects';

const Hologram = lazy(() => import('./Hologram'));

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
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    let raf = 0;
    const scroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--hero-scroll', String(Math.min(1, window.scrollY / Math.max(1, el.clientHeight))));
      });
    };
    window.addEventListener('scroll', scroll, {passive:true});
    return () => {window.removeEventListener('scroll',scroll);cancelAnimationFrame(raf);};
  }, []);
  return <section className="mythic-hero" id="home" ref={hero}>
    <div className="hero-noise" aria-hidden="true" />
    <div className="hero-portal">
      <Suspense fallback={<div className="portal-loading">INITIALIZING PORTAL...</div>}>
        <Hologram />
      </Suspense>
    </div>
    <div className="hero-vignette" aria-hidden="true" />
    <div className="hero-orbit-label orbit-label-top">INTELLIGENCE / CREATION / EXECUTION</div>
    <div className="hero-copy">
      <div className="hero-eyebrow"><span className="line-glyph" /> WELCOME TO MY UNIVERSE <span className="mono">/ 2026</span></div>
      <h1><span className="title-row">IDEAS</span><span className="title-row italic">BECOME</span><span className="title-row">REALITY<span className="dot">.</span></span></h1>
      <p className="hero-summary">A world of engineered ideas, intelligent systems, and visual experiments. Built by <strong>Krityam Singh.</strong></p>
      <div className="hero-buttons">
        <a href="#projects" className="light-button">EXPLORE MY WORK <span>↗</span></a>
        <a href="#about" className="ghost-button">THE PERSON BEHIND IT <span>↓</span></a>
      </div>
      <div className="hero-coordinates"><span>INDIA // BHOPAL</span><span>SCROLL TO ENTER <b>↓</b></span></div>
    </div>
    <div className="identity-glass" data-reveal>
      <div className="identity-photo"><img src="/portrait.jpg" alt="Portrait of Krityam Singh in a blue kurta" /></div>
      <div className="identity-bottom"><div><small>THE BUILDER</small><strong>KRITYAM SINGH</strong></div><span>01 / 01</span></div>
      <span className="identity-corner top-left" /><span className="identity-corner bottom-right" />
    </div>
    <div className="hero-side-label">EST. 2026 <span>✦</span> CONSTANTLY EVOLVING</div>
    <div className="hero-bottom-line"><span>PORTFOLIO / 001</span><span>DRAG THE UNIVERSE WITH YOUR MOUSE</span><span>MORE BELOW ↓</span></div>
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