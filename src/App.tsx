import { useRef, type CSSProperties } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { aboutImages, education, internship, profile, projects, skills, type Project } from './portfolio-data';
import { AnimatedText, ContactButton, FadeIn } from './portfolio-components';
import { LivingPortrait } from './LivingPortrait';

const navigation = [
  ['About', '#about'],
  ['Work', '#work'],
  ['Education', '#education'],
  ['Skills', '#skills'],
  ['Projects', '#projects'],
  ['Contact', '#contact'],
] as const;

function HeroSection() {
  return (
    <section id="home" className="portfolio-hero relative isolate flex flex-col overflow-x-clip" aria-labelledby="hero-title">
      <FadeIn as="nav" y={-20} className="relative z-20 flex flex-wrap justify-between gap-x-2 gap-y-3 px-4 pt-6 sm:px-6 md:px-10 md:pt-8">
        {navigation.map(([label, href]) => (
          <a key={href} href={href} className="text-xs font-medium uppercase tracking-wide text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 sm:text-sm md:text-lg lg:text-[1.4rem]">
            {label}
          </a>
        ))}
      </FadeIn>

      <div id="hero-title" className="mt-8 px-2 text-center sm:mt-6 md:mt-4">
        <FadeIn as="h1" delay={0.15} y={40} className="hero-heading portfolio-name whitespace-nowrap font-black uppercase leading-none">
          {profile.name}
        </FadeIn>
      </div>

      <LivingPortrait />

      <div className="pointer-events-none relative z-20 mt-auto flex items-end justify-between gap-3 px-4 pb-7 sm:px-6 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn delay={0.35} y={20}>
          <p className="max-w-[230px] text-[clamp(0.75rem,1.4vw,1.25rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[260px]">
            {profile.tagline}
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20} className="pointer-events-auto shrink-0">
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}

const aboutDecor = [
  { style: 'left-[1%] top-[4%] w-[120px] sm:left-[2%] sm:w-[160px] md:left-[4%] md:w-[210px]', delay: 0.1, x: -80 },
  { style: 'bottom-[8%] left-[3%] w-[100px] sm:left-[6%] sm:w-[140px] md:left-[10%] md:w-[180px]', delay: 0.25, x: -80 },
  { style: 'right-[1%] top-[4%] w-[120px] sm:right-[2%] sm:w-[160px] md:right-[4%] md:w-[210px]', delay: 0.15, x: 80 },
  { style: 'bottom-[8%] right-[3%] w-[130px] sm:right-[6%] sm:w-[170px] md:right-[10%] md:w-[220px]', delay: 0.3, x: 80 },
];

function AboutSection() {
  return (
    <section id="about" className="relative isolate flex min-h-[min(90svh,48rem)] flex-col items-center justify-center px-5 py-32 text-center sm:px-8 md:px-10">
      {aboutDecor.map(({ style, delay, x }, index) => (
        <FadeIn key={style} className={`pointer-events-none absolute ${style}`} delay={delay} x={x} y={0} duration={0.9}>
          <img className="h-auto w-full opacity-40 sm:opacity-100" src={aboutImages[index]} alt="" loading="lazy" decoding="async" />
        </FadeIn>
      ))}
      <div className="relative z-10 flex flex-col items-center gap-8 sm:gap-12">
        <FadeIn as="h2" y={40} className="hero-heading section-heading">About me</FadeIn>
        <AnimatedText className="max-w-[590px] text-[clamp(1rem,2vw,1.35rem)] font-medium leading-relaxed text-[#D7E2EA]">
          {profile.summary}
        </AnimatedText>
      </div>
    </section>
  );
}

function ToolList({ tools }: { tools: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Technologies">
      {tools.map((tool) => (
        <li key={tool} className="rounded-full border border-[color:color-mix(in_srgb,currentColor_25%,transparent)] px-3 py-1 text-sm">{tool}</li>
      ))}
    </ul>
  );
}

function BackgroundSection() {
  return (
    <div className="rounded-t-[40px] bg-white px-5 pb-32 pt-16 text-[#0C0C0C] sm:rounded-t-[50px] sm:px-8 sm:pt-20 md:rounded-t-[60px] md:px-10 md:pt-24">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:gap-20">
        <section id="work" aria-labelledby="work-heading" className="min-w-0 lg:col-span-2">
          <h2 id="work-heading" className="profile-heading mb-6">Work experience</h2>
          <FadeIn className="grid gap-3 border-y border-black/15 py-6 sm:grid-cols-2 sm:items-center sm:gap-8 sm:py-8">
            <div>
              <h3 className="text-xl font-medium leading-snug sm:text-2xl">{internship.role}</h3>
              <a href={internship.website} className="mt-2 inline-flex items-center gap-1 text-base underline underline-offset-4 transition-opacity hover:opacity-70">
                {internship.company} <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            </div>
            <p className="text-base leading-relaxed text-[#414956]">{internship.description}</p>
          </FadeIn>
        </section>

        <section id="education" aria-labelledby="education-heading" className="min-w-0">
          <h2 id="education-heading" className="profile-heading mb-6">Education</h2>
          <ul className="divide-y divide-black/15 border-y border-black/15">
            {education.map((entry, index) => (
              <FadeIn as="li" key={entry.degree} delay={index * 0.1} className="py-6">
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#414956]">
                  {entry.status}{'cgpa' in entry && ` · CGPA ${entry.cgpa}`}
                </p>
                <h3 className="text-xl font-medium leading-snug sm:text-2xl">{entry.degree}</h3>
                <p className="mt-2 text-base leading-snug">{entry.institution}</p>
                <p className="mt-1 text-sm text-[#414956]">{entry.location}</p>
              </FadeIn>
            ))}
          </ul>
        </section>

        <section id="skills" aria-labelledby="skills-heading" className="min-w-0">
          <h2 id="skills-heading" className="profile-heading mb-6">Technical skills</h2>
          <ul className="divide-y divide-black/15 border-y border-black/15">
            {skills.map((group, index) => (
              <FadeIn as="li" key={group.name} delay={index * 0.1} className="py-5">
                <h3 className="mb-3 text-base font-medium uppercase tracking-wide">{group.name}</h3>
                <ToolList tools={group.tools} />
              </FadeIn>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ProjectCard({ project, index, progress }: {
  project: Project;
  index: number;
  progress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const targetScale = 1 - (projects.length - 1 - index) * 0.03;
  const scale = useTransform(progress, [index / projects.length, 1], [1, targetScale]);

  return (
    <div className="project-stack-card" style={{ '--stack-offset': `${index * 20}px` } as CSSProperties}>
      <motion.article
        className="origin-top rounded-[32px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-5 text-[#D7E2EA] sm:rounded-[44px] sm:p-8 lg:p-10"
        style={{ scale: reduced ? 1 : scale }}
      >
        <div className="flex items-start gap-4 sm:gap-7">
          <span className="project-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <h3 className="text-[clamp(1.35rem,4.2vw,3.5rem)] font-medium leading-tight">{project.name}</h3>
            {project.subtitle && <p className="mt-1 text-base leading-snug text-[#AEB9C4]">{project.subtitle}</p>}
          </div>
        </div>
        <ul className="my-6 list-disc space-y-2 pl-5 text-base leading-relaxed text-[#D7E2EA] sm:text-lg">
          {project.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-white/20 pt-5">
          <ToolList tools={project.tools} />
          {project.link && (
            <a className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4 transition-opacity hover:opacity-70" href={project.link.url}>
              {project.link.label} <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          )}
        </div>
      </motion.article>
    </div>
  );
}

function ProjectsSection() {
  const stack = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stack, offset: ['start start', 'end end'] });

  return (
    <section id="projects" aria-labelledby="projects-heading" className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-5 pt-16 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 sm:pt-20 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pt-24">
      <h2 id="projects-heading" className="hero-heading section-heading mb-12 sm:mb-16">Selected projects</h2>
      <div ref={stack} className="mx-auto max-w-6xl space-y-5">
        {projects.map((project, index) => (
          <ProjectCard key={project.name} project={project} index={index} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <footer id="contact" className="mx-auto mt-16 flex max-w-6xl flex-col gap-8 border-t border-[#D7E2EA]/30 px-5 py-12 text-[#D7E2EA] sm:mt-20 sm:px-8 md:px-10 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="profile-heading mb-4">Contact</h2>
        <address className="flex flex-col items-start gap-2 text-base not-italic">
          <a href={`mailto:${profile.email}`} className="break-all underline-offset-4 hover:underline">{profile.email}</a>
          <a href={`tel:${profile.phone.replaceAll(' ', '')}`} className="underline-offset-4 hover:underline">{profile.phone}</a>
          <span>{profile.location}</span>
        </address>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-70" href={profile.github}>
          GitHub <ArrowUpRight aria-hidden="true" size={16} />
        </a>
        <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-70" href={profile.linkedin}>
          LinkedIn <ArrowUpRight aria-hidden="true" size={16} />
        </a>
        <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-70" href={profile.website}>
          genesisxweb.in <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <main className="overflow-x-clip bg-[#0C0C0C]">
      <HeroSection />
      <AboutSection />
      <BackgroundSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  );
}
