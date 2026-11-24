export const profile = {
  name: 'Krityam Singh',
  tagline: 'CSE (AI/ML) student focused on software development with Python and Go.',
  summary: 'I’m a B.Tech student specializing in Computer Science & Engineering (AI/ML), with a completed diploma and project experience across real-time communication software, AI-assisted video workflows, and automation systems. I work with Python and Go and am strengthening my skills in data structures, algorithms, and practical software development.',
  email: 'krityamsingh100@gmail.com',
  phone: '+91 9208010347',
  location: 'Madhya Pradesh, India',
  github: 'https://github.com/krityamsingh',
  linkedin: 'https://www.linkedin.com/in/krityamsingh/',
  website: 'https://genesisxweb.in/',
} as const;

export const internship = {
  role: 'Off-Page SEO Intern',
  company: 'Kenerate AI',
  website: 'https://kenerateai.com/',
  description: 'Built backlinks and created listings to help creators discover Kenerate AI’s tools.',
} as const;

export const education = [
  {
    degree: 'B.Tech, Computer Science & Engineering (AI/ML)',
    institution: 'Oriental Institute of Science & Technology (OIST)',
    location: 'Bhopal, Madhya Pradesh',
    status: 'Pursuing',
  },
  {
    degree: 'Diploma',
    institution: 'Sarvepalli Radhakrishnan University (SRK University)',
    location: 'Bhopal, Madhya Pradesh',
    status: 'Completed',
    cgpa: '7.25',
  },
] as const;

export const skills = [
  { name: 'Programming languages', tools: ['Python', 'Go'] },
  {
    name: 'Technologies used in projects',
    tools: ['React', 'FastAPI', 'REST APIs', 'WebSockets', 'Redis', 'Supabase', 'Docker', 'FFmpeg'],
  },
  { name: 'Development & collaboration', tools: ['Git', 'GitHub', 'Linux'] },
] as const;

export type Project = {
  name: string;
  subtitle?: string;
  details: readonly string[];
  tools: readonly string[];
  link?: { label: string; url: string };
};

export const projects: readonly Project[] = [
  {
    name: 'GenesisX',
    subtitle: 'Privacy-focused real-time communication platform',
    details: [
      'An ongoing real-time communication web project with a React frontend and a Go backend.',
      'The repository documents authenticated APIs, WebSocket signaling, encrypted offline relay, and video-room integration.',
    ],
    tools: ['React', 'Go', 'WebSockets', 'Redis'],
    link: { label: 'Visit GenesisX', url: profile.website },
  },
  {
    name: 'AI Video Clipping & Editing Engine',
    details: [
      'A local-first video-processing project designed to find highlight candidates using speech, audio peaks, and scene-change signals.',
      'The repository documents automatic transcription, caption generation, vertical video layouts, and a local web dashboard.',
    ],
    tools: ['Python', 'Faster-Whisper', 'FFmpeg', 'FastAPI'],
    link: { label: 'View GitHub repository', url: 'https://github.com/krityamsingh/AI-Clipping' },
  },
  {
    name: 'KenerateAI Creator Lab',
    subtitle: 'Editorial website for AI creators',
    details: [
      'A lightweight editorial site with guides on AI tools and workflows for creators.',
      'Built with semantic HTML, a sitemap, and a machine-readable site guide to help search engines and AI crawlers discover the content.',
    ],
    tools: ['HTML', 'CSS', 'Vercel'],
    link: { label: 'Visit Creator Lab', url: 'https://kenerateai-blog.vercel.app/' },
  },
];

export const aboutImages = [
  "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png",
  "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png",
  "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png",
  "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png"
] as const;
