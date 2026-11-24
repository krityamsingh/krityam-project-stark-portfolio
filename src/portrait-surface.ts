const CELLS = 26;
const ROW = CELLS + 1;
const VERTICES = ROW * ROW;
const CANVAS_SCALE = 1.7;
const STEP = 1 / 240;
const GAP = 0.25 / CELLS;
const MAX_TEXTURES = 10;

export type Point = { x: number; y: number };
export type Pull = Point & { dx: number; dy: number };

const vertexSource = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 coords;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    coords = uv;
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D previousFrame;
  uniform sampler2D currentFrame;
  uniform float blend;
  varying vec2 coords;
  void main() {
    gl_FragColor = mix(texture2D(previousFrame, coords), texture2D(currentFrame, coords), blend);
  }
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const object = gl.createShader(type);
  if (!object) throw new Error('Unable to allocate portrait shader.');
  gl.shaderSource(object, source);
  gl.compileShader(object);
  if (!gl.getShaderParameter(object, gl.COMPILE_STATUS)) {
    gl.deleteShader(object);
    throw new Error('Unable to compile portrait shader.');
  }
  return object;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = shader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate portrait program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error('Unable to link portrait program.');
  }
  return program;
}

class Sheet {
  readonly uv = new Float32Array(VERTICES * 2);
  readonly indices = new Uint16Array(CELLS * CELLS * 6);
  readonly vertices = new Float32Array(VERTICES * 2);
  private readonly position = new Float32Array(VERTICES * 2);
  private readonly velocity = new Float32Array(VERTICES * 2);
  private readonly nextVelocity = new Float32Array(VERTICES * 2);
  private readonly weights = new Float32Array(VERTICES);
  private readonly neighbours = new Int16Array(VERTICES * 4).fill(-1);
  private remaining = 0;
  private anchor: Point | null = null;
  private leanX = 0;
  private leanY = 0;

  constructor() {
    for (let row = 0; row < ROW; row++) {
      for (let col = 0; col < ROW; col++) {
        const i = row * ROW + col;
        this.uv[i * 2] = col / CELLS;
        this.uv[i * 2 + 1] = row / CELLS;
        this.neighbours.set([
          col > 0 ? i - 1 : -1, col < CELLS ? i + 1 : -1,
          row > 0 ? i - ROW : -1, row < CELLS ? i + ROW : -1,
        ], i * 4);

        if (row < CELLS && col < CELLS) {
          this.indices.set([i, i + 1, i + ROW, i + 1, i + ROW + 1, i + ROW], (row * CELLS + col) * 6);
        }
      }
    }
  }

  update(dt: number, look: Point, pull: Pull | null, reduced: boolean) {
    if (pull && (pull.x !== this.anchor?.x || pull.y !== this.anchor?.y)) {
      this.anchor = pull;
      for (let i = 0; i < VERTICES; i++) {
        const x = this.uv[i * 2] - pull.x;
        const y = this.uv[i * 2 + 1] - pull.y;
        this.weights[i] = Math.exp(-(x * x + y * y) / (0.34 * 0.34));
      }
    }

    const lean = 1 - Math.exp(-dt * 8);
    this.leanX += ((reduced ? 0 : look.x) - this.leanX) * lean;
    this.leanY += ((reduced ? 0 : look.y) - this.leanY) * lean;

    this.remaining += Math.min(dt, 0.05);
    while (this.remaining >= STEP) {
      this.integrate(pull);
      this.remaining -= STEP;
    }

    this.untangle();

    for (let i = 0; i < VERTICES; i++) {
      const x = i * 2;
      const y = x + 1;
      const fromCenterY = this.uv[y] - 0.5;
      const leanX = this.leanX * (0.018 - 0.035 * fromCenterY);
      this.vertices[x] = (this.uv[x] + this.position[x] + leanX - 0.5) * 2 / CANVAS_SCALE;
      this.vertices[y] = (0.5 - this.uv[y] - this.position[y] - this.leanY * 0.018) * 2 / CANVAS_SCALE;
    }
  }

  private integrate(pull: Pull | null) {
    for (let i = 0; i < VERTICES; i++) {
      const x = i * 2;
      const y = x + 1;
      const targetX = pull ? pull.dx * this.weights[i] : 0;
      const targetY = pull ? pull.dy * this.weights[i] : 0;
      let springX = 0;
      let springY = 0;

      for (let side = 0; side < 4; side++) {
        const neighbour = this.neighbours[i * 4 + side];
        if (neighbour < 0) continue;
        springX += this.position[neighbour * 2] - this.position[x];
        springY += this.position[neighbour * 2 + 1] - this.position[y];
      }

      this.nextVelocity[x] = this.velocity[x] + STEP * (180 * (targetX - this.position[x]) + 155 * springX - 13 * this.velocity[x]);
      this.nextVelocity[y] = this.velocity[y] + STEP * (180 * (targetY - this.position[y]) + 155 * springY - 13 * this.velocity[y]);
    }

    for (let i = 0; i < this.position.length; i++) {
      this.velocity[i] = this.nextVelocity[i];
      this.position[i] += this.velocity[i] * STEP;
    }
  }

  private untangle() {
    const space = 1 / CELLS;

    for (let row = 0; row < ROW; row++) {
      for (let col = 1; col < ROW; col++) {
        const i = (row * ROW + col) * 2;
        const min = this.position[i - 2] + GAP - space;
        if (this.position[i] < min) {
          this.position[i] = min;
          this.velocity[i] = Math.max(0, this.velocity[i]);
        }
      }
    }

    for (let col = 0; col < ROW; col++) {
      for (let row = 1; row < ROW; row++) {
        const i = (row * ROW + col) * 2 + 1;
        const min = this.position[i - ROW * 2] + GAP - space;
        if (this.position[i] < min) {
          this.position[i] = min;
          this.velocity[i] = Math.max(0, this.velocity[i]);
        }
      }
    }

    // Check diagonal shear as well as row and column order before drawing the sheet.
    if (!this.facingForward()) {
      for (let i = 0; i < this.position.length; i++) {
        this.position[i] *= 0.25;
        this.velocity[i] *= 0.25;
      }
      if (!this.facingForward()) {
        this.position.fill(0);
        this.velocity.fill(0);
      }
    }
  }

  private facingForward() {
    for (let i = 0; i < this.indices.length; i += 3) {
      const a = this.indices[i] * 2;
      const b = this.indices[i + 1] * 2;
      const c = this.indices[i + 2] * 2;
      const ux = this.uv[b] + this.position[b] - this.uv[a] - this.position[a];
      const uy = this.uv[b + 1] + this.position[b + 1] - this.uv[a + 1] - this.position[a + 1];
      const vx = this.uv[c] + this.position[c] - this.uv[a] - this.position[a];
      const vy = this.uv[c + 1] + this.position[c + 1] - this.uv[a + 1] - this.position[a + 1];
      if (ux * vy - vx * uy < GAP * GAP) return false;
    }
    return true;
  }
}

export function makePortraitSurface(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return null;

  const sheet = new Sheet();
  const program = createProgram(gl);
  const position = gl.createBuffer();
  const uv = gl.createBuffer();
  const indices = gl.createBuffer();
  const textures = new Map<string, WebGLTexture>();
  const blend = gl.getUniformLocation(program, 'blend');
  const currentFrame = gl.getUniformLocation(program, 'currentFrame');
  const previousFrame = gl.getUniformLocation(program, 'previousFrame');
  const coords = gl.getAttribLocation(program, 'position');
  const textureCoords = gl.getAttribLocation(program, 'uv');

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, uv);
  gl.bufferData(gl.ARRAY_BUFFER, sheet.uv, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(textureCoords);
  gl.vertexAttribPointer(textureCoords, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, sheet.vertices, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(coords);
  gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sheet.indices, gl.STATIC_DRAW);
  gl.clearColor(0, 0, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.uniform1i(previousFrame, 0);
  gl.uniform1i(currentFrame, 1);

  let toKey = '';
  let fromKey = '';
  let changedAt = 0;
  let width = 0;
  let height = 0;

  function textureFor(key: string, image: HTMLImageElement) {
    if (!gl) return null;
    const existing = textures.get(key);
    if (existing) {
      textures.delete(key);
      textures.set(key, existing);
      return existing;
    }

    const texture = gl.createTexture();
    if (!texture) return null;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textures.set(key, texture);

    if (textures.size > MAX_TEXTURES) {
      for (const [oldKey, oldTexture] of textures) {
        if (oldKey === fromKey || oldKey === toKey || oldKey === key) continue;
        textures.delete(oldKey);
        gl.deleteTexture(oldTexture);
        break;
      }
    }
    return texture;
  }

  const observer = new ResizeObserver(([entry]) => {
    const scale = Math.min(window.devicePixelRatio || 1, 2, 2048 / Math.max(entry.contentRect.width, entry.contentRect.height, 1));
    width = Math.max(1, Math.round(entry.contentRect.width * scale));
    height = Math.max(1, Math.round(entry.contentRect.height * scale));
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  });
  observer.observe(canvas);

  return {
    draw(key: string, image: HTMLImageElement, dt: number, now: number, look: Point, pull: Pull | null, reduced: boolean) {
      if (!width || !height) return false;

      const texture = textureFor(key, image);
      if (!texture) return false;

      if (key !== toKey) {
        fromKey = toKey;
        toKey = key;
        changedAt = now;
      }

      const mix = reduced || !fromKey ? 1 : Math.min(1, (now - changedAt) / 65);
      sheet.update(dt, look, pull, reduced);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, position);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sheet.vertices);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, mix < 1 ? textures.get(fromKey) ?? texture : texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1f(blend, mix);
      gl.drawElements(gl.TRIANGLES, sheet.indices.length, gl.UNSIGNED_SHORT, 0);
      return true;
    },
    dispose() {
      observer.disconnect();
      for (const texture of textures.values()) gl.deleteTexture(texture);
      gl.deleteBuffer(position);
      gl.deleteBuffer(uv);
      gl.deleteBuffer(indices);
      gl.deleteProgram(program);
    },
  };
}
