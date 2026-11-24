import { makePortraitSurface, type Point, type Pull } from './portrait-surface';

const urls = import.meta.glob<string>('./assets/portrait/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const images = new Map(Object.entries(urls).map(([path, url]) => [path.split('/').pop()!.slice(0, -5), url]));
export const portraitFallback = images.get('closed') ?? images.get('neutral')!;

const gazeFrames = [
  'right', 'gaze-1', 'gaze-2', 'gaze-3',
  'down', 'gaze-5', 'gaze-6', 'gaze-7',
  'left', 'gaze-9', 'gaze-10', 'gaze-11',
  'up', 'gaze-13', 'gaze-14', 'gaze-15',
];
const hairFrames = ['neutral', 'hair-pink', 'hair-blue', 'hair-blonde'];
const contactSelector = '[data-portrait-contact]';

type Region = 'hair' | 'forehead' | 'leftEye' | 'rightEye' | 'nose' | 'lips' | 'cheek' | 'chin';
type Keyframe = [picture: string, duration: number, prop?: 'fly' | 'hand'];
type Action = { frames: Keyframe[]; start: number; idle: boolean };

const hoverFrames: Partial<Record<Region, string>> = {
  leftEye: 'wink-left', rightEye: 'wink-right', nose: 'cross', lips: 'kiss',
};
const tapFrames: Partial<Record<Region, string>> = {
  forehead: 'angry', leftEye: 'ouch', rightEye: 'ouch', lips: 'tongue', cheek: 'puff', chin: 'laugh',
};
const sneeze: Keyframe[] = [
  ['sneeze-anticipate', 410], ['sneeze', 280], ['sneeze-after', 460],
];
const idleActs: Keyframe[][] = [
  [['yawn-start', 400], ['yawn', 900], ['half', 350]],
  [['left', 460], ['gaze-14', 440], ['right', 460], ['left', 350]],
  [['bubble-chew', 410], ['bubble-small', 560], ['bubble-big', 710], ['bubble-pop', 500]],
  [['neutral', 1100, 'fly'], ['cross', 650, 'fly'], ['blow', 540, 'fly']],
  [['flirt', 670], ['wink-left', 420], ['grin', 450]],
  [['gaze-10', 350], ['roll', 630], ['gaze-14', 340]],
  sneeze,
  [['hair-pink', 580], ['hair-blue', 580], ['hair-blonde', 740]],
  [['neutral', 480, 'hand'], ['shock', 620, 'hand'], ['scrunch', 430, 'hand']],
  [['cross', 440], ['fish', 750]],
  [['whistle', 650], ['gaze-13', 330], ['whistle', 460]],
  [['snore-half', 760], ['snore', 980], ['closed', 570], ['startled', 350]],
  [['tongue', 650], ['grin', 460]],
  [['star', 1100], ['grin', 420]],
  [['tear', 580], ['cry', 950], ['half', 390]],
];

const substitute: Record<string, string> = {
  half: 'closed',
  'yawn-start': 'half', 'yawn': 'shock',
  'bubble-chew': 'puff', 'bubble-small': 'puff', 'bubble-big': 'puff', 'bubble-pop': 'shock',
  'sneeze-anticipate': 'scrunch', 'sneeze': 'ouch', 'sneeze-after': 'half',
  'dizzy': 'cross', 'scrunch': 'ouch', 'fish': 'kiss', 'whistle': 'kiss', 'snore': 'closed',
  'star': 'heart', 'flirt': 'grin', 'roll': 'up', 'tear': 'cry',
  'blow': 'puff', 'snore-half': 'half', 'startled': 'shock',
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function regionAt({ x, y }: Point): Region | null {
  const distance = Math.abs(x - 0.5);
  if (distance > 0.27 || y < 0.03 || y > 0.96) return null;
  if (y < 0.22 || (y < 0.41 && distance > 0.2)) return 'hair';
  if (y < 0.34) return 'forehead';
  if (y < 0.43 && distance > 0.035 && distance < 0.19) return x < 0.5 ? 'leftEye' : 'rightEye';
  if (y < 0.52 && distance < 0.081) return 'nose';
  if (y >= 0.52 && y < 0.61 && distance < 0.115) return 'lips';
  if (y >= 0.61 && distance < 0.15) return 'chin';
  return 'cheek';
}

function makeLibrary() {
  const cache = new Map<string, HTMLImageElement>();
  const failed = new Set<string>();

  function get(key: string) {
    const url = images.get(key);
    if (!url || failed.has(key)) return null;

    let image = cache.get(key);
    if (!image) {
      image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onerror = () => failed.add(key);
      image.src = url;
    }

    cache.delete(key);
    cache.set(key, image);
    if (cache.size > 16) cache.delete(cache.keys().next().value!);
    return image.complete && image.naturalWidth ? image : null;
  }

  function pick(key: string) {
    const candidates = key.startsWith('gaze-')
      ? [key, gazeFrames[Math.round(Number(key.slice(5)) / 4) * 4 % 16], 'neutral']
      : [key, substitute[key], 'neutral'];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const image = get(candidate);
      if (image) return { key: candidate, image };
    }
    return null;
  }

  return { get, pick };
}

function isContact(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(contactSelector));
}

function placeProp(element: SVGElement, visible: boolean, x = 0, y = 0) {
  if (element.classList.contains('is-visible') !== visible) {
    element.style.opacity = visible ? '1' : '0';
    element.classList.toggle('is-visible', visible);
  }
  if (!visible) return;
  element.style.left = `${x * 100}%`;
  element.style.top = `${y * 100}%`;
}

export function mountPortrait(
  wrapper: HTMLElement,
  fallback: HTMLImageElement,
  canvas: HTMLCanvasElement,
  fly: SVGElement,
  hand: SVGElement,
) {
  const events = new AbortController();
  const listener = { passive: true, signal: events.signal };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const library = makeLibrary();
  let surface: ReturnType<typeof makePortraitSurface> = null;
  let renderId = 0;
  let previousFrame = 0;
  let visible = true;
  let awakeAt = 0;
  let nextBlink = 0;
  let blinkAt = 0;
  let idleAt = performance.now() + randomBetween(30_000, 45_000);
  let nextAct = 0;
  let action: Action | null = null;
  let region: Region | null = null;
  let regionAtTime = 0;
  let scrollUntil = 0;
  let hair = 0;
  let contact = false;
  let previousMove = { x: 0, y: 0, time: 0, dx: 0, dy: 0 };
  let shakes: number[] = [];
  let pulls: number[] = [];
  let look: Point = { x: 0, y: 0 };
  let held: { id: number; start: Point; region: Region; distance: number; peakDistance: number; pull: Pull } | null = null;

  function startSurface() {
    try {
      surface = makePortraitSurface(canvas);
    } catch {
      surface = null;
    }
    canvas.dataset.renderer = 'fallback';
  }
  startSurface();

  for (const key of ['closed', 'half', 'neutral', 'left', 'right', 'down', 'up', 'grin']) library.get(key);

  function wake(now: number) {
    if (awakeAt) return;
    awakeAt = now;
    nextBlink = now + randomBetween(2200, 5600);
  }

  function activity(now: number) {
    idleAt = now + randomBetween(30_000, 45_000);
    if (action?.idle) action = null;
  }

  function play(frames: Keyframe[], now: number, idle = false) {
    action = { frames, start: now, idle };
    for (const [key] of frames) library.get(key);
  }

  function expression(name: string, duration: number, now: number) {
    play([[name, duration]], now);
  }

  function local(x: number, y: number): Point {
    const box = wrapper.getBoundingClientRect();
    return { x: (x - box.left) / box.width, y: (y - box.top) / box.height };
  }

  function watchShake(x: number, y: number, now: number) {
    const elapsed = now - previousMove.time;
    const dx = x - previousMove.x;
    const dy = y - previousMove.y;
    const reversed = dx * previousMove.dx + dy * previousMove.dy < 0;
    if (reversed && elapsed > 0 && elapsed < 145 && Math.hypot(dx, dy) / elapsed > 0.85) {
      shakes = [...shakes.filter((stamp) => now - stamp < 2500), now];
      if (shakes.length >= 7) expression('sick', 1250, now);
      else if (shakes.filter((stamp) => now - stamp < 850).length >= 3) expression('wind', 700, now);
    } else if (elapsed > 400) {
      shakes = [];
    }
    previousMove = { x, y, time: now, dx, dy };
  }

  function pointerMove(event: PointerEvent) {
    const now = performance.now();
    activity(now);
    wake(now);
    const point = local(event.clientX, event.clientY);
    look = {
      x: Math.min(1, Math.max(-1, (point.x - 0.5) * 1.85)),
      y: Math.min(1, Math.max(-1, (point.y - 0.4) * 1.85)),
    };

    if (!visible) return;

    if (held?.id === event.pointerId) {
      const dx = point.x - held.start.x;
      const dy = point.y - held.start.y;
      const distance = Math.hypot(dx, dy);
      const scale = distance > 0.18 ? 0.18 / distance : 1;
      held.distance = distance;
      held.peakDistance = Math.max(held.peakDistance, distance);
      held.pull.dx = dx * scale;
      held.pull.dy = dy * scale;
      return;
    }

    const nextRegion = event.pointerType === 'mouse' ? regionAt(point) : null;
    if (nextRegion !== region) {
      region = nextRegion;
      regionAtTime = now;
      if (region && hoverFrames[region]) library.get(hoverFrames[region]!);
    }
    if (!contact && event.pointerType === 'mouse') watchShake(event.clientX, event.clientY, now);
  }

  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || held) return;
    const now = performance.now();
    const point = local(event.clientX, event.clientY);
    const hit = regionAt(point);
    if (!hit) return;

    activity(now);
    wake(now);
    action = null;
    held = { id: event.pointerId, start: point, region: hit, distance: 0, peakDistance: 0, pull: { ...point, dx: 0, dy: 0 } };
    wrapper.setPointerCapture(event.pointerId);
  }

  function endPointer(event: PointerEvent) {
    if (!held || event.pointerId !== held.id) return;
    const gesture = held;
    held = null;
    if (event.type !== 'pointerup') return;

    const now = performance.now();
    activity(now);
    if (gesture.peakDistance > 0.022) {
      pulls = [...pulls.filter((stamp) => now - stamp < 14_000), now];
      const name = pulls.length >= 8 ? 'cry' : pulls.length >= 5 ? 'angry' : gesture.peakDistance > 0.15 ? 'dizzy' : 'scrunch';
      expression(name, pulls.length >= 5 ? 1400 : 770, now);
    } else if (gesture.region === 'hair') {
      hair = (hair + 1) % hairFrames.length;
      library.get(hairFrames[hair]);
    } else if (gesture.region === 'nose') {
      play(sneeze, now);
    } else if (tapFrames[gesture.region]) {
      expression(tapFrames[gesture.region]!, 940, now);
    }
  }

  function contactEnter(event: Event) {
    const from = (event as FocusEvent | PointerEvent).relatedTarget;
    if (!isContact(event.target) || isContact(from)) return;
    const now = performance.now();
    activity(now);
    wake(now);
    contact = true;
    library.get('heart');
  }

  function contactLeave(event: Event) {
    const to = (event as FocusEvent | PointerEvent).relatedTarget;
    if (!isContact(event.target) || isContact(to)) return;
    const now = performance.now();
    activity(now);
    contact = false;
    expression('grin', 880, now);
  }

  function gaze() {
    if (Math.hypot(look.x, look.y) < 0.18) return 'neutral';
    const angle = Math.atan2(look.y, look.x);
    return gazeFrames[(Math.round(angle * (8 / Math.PI)) + 16) % 16];
  }

  function activeKey(now: number) {
    if (held && held.distance > 0.022) {
      if (held.distance > 0.20) return 'scared';
      if (held.distance > 0.10) return 'ouch';
      return 'shock';
    }
    if (contact) return 'heart';
    if (action && !action.idle) return null;
    if (!awakeAt) return 'closed';
    if (now - awakeAt < 120) return 'half';
    if (!hair && now < scrollUntil) return 'down';
    if (region && hoverFrames[region] && now - regionAtTime >= 80) return hoverFrames[region]!;
    if (hair) return hairFrames[hair];
    if (blinkAt && now - blinkAt < 150) return now - blinkAt < 45 || now - blinkAt > 108 ? 'half' : 'closed';
    return gaze();
  }

  function keyframe(now: number) {
    if (!action) return null;
    let elapsed = now - action.start;
    for (const frame of action.frames) {
      if (elapsed < frame[1]) return { key: frame[0], prop: frame[2], elapsed, progress: elapsed / frame[1] };
      elapsed -= frame[1];
    }
    if (action.idle) idleAt = now + randomBetween(2700, 5000);
    action = null;
    return null;
  }

  function animate(now: number) {
    renderId = 0;
    if (!visible) return;
    const dt = previousFrame ? (now - previousFrame) / 1000 : 1 / 60;
    previousFrame = now;

    if (!motion.matches && !held && !contact && !action && now >= idleAt) {
      play(idleActs[nextAct], now, true);
      nextAct = (nextAct + 1) % idleActs.length;
    }
    if (awakeAt && !motion.matches && now >= nextBlink) {
      blinkAt = now;
      nextBlink = now + randomBetween(2200, 5600);
    }

    const frame = keyframe(now);
    const key = frame && (action?.idle || !held) && !contact ? frame.key : activeKey(now) ?? 'neutral';
    const picture = library.pick(key);
    let pull = held && held.distance > 0.022 ? held.pull : null;
    if (frame?.prop === 'fly') {
      const approach = frame.key === 'neutral' ? 1 - frame.progress : 0;
      const escape = frame.key === 'blow' ? frame.progress : 0;
      const x = 0.5 + approach * 0.38 - escape * 0.59;
      const y = 0.465 + Math.sin(frame.elapsed * 0.02) * (approach + escape) * 0.08 - escape * 0.22;
      placeProp(fly, true, x, y);
    } else {
      placeProp(fly, false);
    }

    if (frame?.prop === 'hand') {
      const grabbing = frame.key === 'shock';
      const reach = frame.key === 'neutral' ? 1 - frame.progress : frame.key === 'scrunch' ? frame.progress : 0;
      const displacement = grabbing ? 0.105 * Math.sin(Math.PI * frame.progress) : 0;
      hand.classList.toggle('shut', grabbing);
      placeProp(hand, true, 0.70 + reach * 0.23 + displacement, 0.55);
      if (grabbing) pull = { x: 0.67, y: 0.55, dx: displacement, dy: -0.035 * Math.sin(Math.PI * frame.progress) };
    } else {
      placeProp(hand, false);
    }

    if (picture) {
      if (surface?.draw(picture.key, picture.image, dt, now, look, motion.matches ? null : pull, motion.matches)) {
        if (canvas.dataset.renderer !== 'webgl') canvas.dataset.renderer = 'webgl';
      } else if (!surface) {
        if (fallback.src !== picture.image.src) fallback.src = picture.image.src;
      }
      if (canvas.dataset.frame !== picture.key) canvas.dataset.frame = picture.key;
    }
    renderId = requestAnimationFrame(animate);
  }

  function stopFrame() {
    if (renderId) cancelAnimationFrame(renderId);
    renderId = 0;
    previousFrame = 0;
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      stopFrame();
      if (action?.idle) action = null;
    } else if (!renderId) {
      renderId = requestAnimationFrame(animate);
    }
  });
  observer.observe(wrapper);

  window.addEventListener('pointermove', pointerMove, listener);
  window.addEventListener('pointerdown', () => activity(performance.now()), listener);
  window.addEventListener('wheel', () => activity(performance.now()), listener);
  window.addEventListener('keydown', () => activity(performance.now()), listener);
  window.addEventListener('scroll', () => {
    const now = performance.now();
    activity(now);
    scrollUntil = now + 420;
  }, listener);
  window.addEventListener('pointerover', contactEnter, listener);
  window.addEventListener('pointerout', contactLeave, listener);
  window.addEventListener('focusin', contactEnter, listener);
  window.addEventListener('focusout', contactLeave, listener);
  wrapper.addEventListener('pointerdown', pointerDown, listener);
  wrapper.addEventListener('pointerup', endPointer, listener);
  wrapper.addEventListener('pointercancel', endPointer, listener);
  wrapper.addEventListener('lostpointercapture', endPointer, listener);
  wrapper.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const now = performance.now();
    wake(now);
    expression('grin', 880, now);
  }, { signal: events.signal });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    surface?.dispose();
    surface = null;
    canvas.dataset.renderer = 'fallback';
  }, { signal: events.signal });
  canvas.addEventListener('webglcontextrestored', startSurface, { signal: events.signal });

  renderId = requestAnimationFrame(animate);

  return () => {
    events.abort();
    observer.disconnect();
    stopFrame();
    surface?.dispose();
  };
}
