# PROJECT STARK — Krityam Singh

An original, cinematic personal portfolio built with **React 18, TypeScript, Three.js, React Three Fiber, Drei and Vite**. This does not redistribute the MoncyDev website or its proprietary assets.

## Structure

- `src/main.tsx` — React entry point
- `src/App.tsx` — scroll-driven hero, project case studies, responsive UI
- `src/Hologram.tsx` — animated, interactive real WebGL/Three.js centerpiece
- `src/projects.ts` — typed project metadata
- `src/styles.css` — cinematic styling and responsive layouts
- `public/portrait.jpg` — your newly provided portrait (temporary low-resolution web preview)

## Run locally

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```

Vercel: Framework **Vite**, build command `npm run build`, output directory `dist`.

## Video assets

To embed a recorded demo, upload your media to a storage/CDN service or add optimized footage to `public/media`, then set the corresponding `video` path in `src/projects.ts`. Media panels currently show labeled concepts unless a video URL is configured. Do not represent concept animations as recorded product demos.

## Portfolio projects

GenesisX, AI Clipping, SEO Automation, Kenerate AI creative advertisement, FrontierAtlas. Only public verified source links are presented; statuses reflect work in progress.

The root `index.html` is only the minimal **Vite mount file**, not a hand-coded static webpage.
