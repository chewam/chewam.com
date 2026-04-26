// WebGL shader background — multi-mode fragment shader.

const SHADER_VS = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const SHADER_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_scroll;
uniform int u_mode;
uniform vec3 u_a1;
uniform vec3 u_a2;
uniform vec3 u_a3;
uniform vec3 u_bg;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
}

float metaball(vec2 uv, vec2 c, float r) {
  return r / (length(uv - c) + 0.001);
}

vec3 metaballsScene(vec2 uv, float t, vec2 m) {
  float f = 0.0;
  f += metaball(uv, vec2(sin(t*0.7)*0.6, cos(t*0.5)*0.4), 0.18);
  f += metaball(uv, vec2(cos(t*0.4)*0.5 + m.x*0.3, sin(t*0.9)*0.5 + m.y*0.3), 0.14);
  f += metaball(uv, vec2(sin(t*1.1)*0.4, sin(t*0.6)*0.6), 0.12);
  f += metaball(uv, vec2(cos(t*0.3)*0.7, cos(t*0.8)*0.3), 0.10);
  vec3 col = u_bg;
  if (f > 1.6) col = mix(col, u_a1, smoothstep(1.6, 2.0, f) * 0.7);
  if (f > 2.0) col = mix(col, u_a2, smoothstep(2.0, 2.6, f) * 0.7);
  if (f > 2.6) col = mix(col, u_a3, smoothstep(2.6, 3.2, f) * 0.6);
  return col;
}

vec3 voronoiScene(vec2 uv, float t) {
  vec2 g = uv * 4.0;
  vec2 i = floor(g); vec2 f = fract(g);
  float md = 1.0; vec2 mp;
  for (int y=-1; y<=1; y++) {
    for (int x=-1; x<=1; x++) {
      vec2 n = vec2(float(x), float(y));
      vec2 o = vec2(hash(i+n), hash(i+n+13.7));
      o = 0.5 + 0.5*sin(t*0.6 + 6.2831*o);
      vec2 r = n + o - f;
      float d = dot(r, r);
      if (d < md) { md = d; mp = i + n; }
    }
  }
  float edge = sqrt(md);
  vec3 col = mix(u_bg, u_a2, edge * 0.4);
  if (edge < 0.05) col = u_a1;
  return col;
}

vec3 plasmaScene(vec2 uv, float t) {
  float v = 0.0;
  v += sin(uv.x * 4.0 + t);
  v += sin((uv.y * 4.0 + t) * 0.5);
  v += sin((uv.x * 3.0 + uv.y * 3.0 + t) * 0.5);
  v += sin(sqrt(uv.x*uv.x + uv.y*uv.y) * 6.0 + t);
  v *= 0.25;
  vec3 col = mix(u_bg, u_a1, smoothstep(-0.2, 0.4, v));
  col = mix(col, u_a2, smoothstep(0.1, 0.7, v) * 0.6);
  col = mix(col, u_a3, smoothstep(0.5, 1.0, v) * 0.4);
  return col;
}

vec3 ringsScene(vec2 uv, float t, vec2 m) {
  float d = length(uv - m * 0.5);
  float r = sin(d * 30.0 - t * 2.0);
  vec3 col = mix(u_bg, u_a1, smoothstep(0.95, 1.0, r));
  col = mix(col, u_a2, smoothstep(-1.0, -0.95, r));
  // soft halo
  col = mix(col, u_a3, smoothstep(0.0, 0.05, abs(r) - 0.97) * 0.3);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 m = (u_mouse - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.6 + u_scroll * 0.001;
  vec3 col;
  if (u_mode == 0) col = metaballsScene(uv, t, m);
  else if (u_mode == 1) col = voronoiScene(uv, t);
  else if (u_mode == 2) col = plasmaScene(uv, t);
  else col = ringsScene(uv, t, m);

  // soft vignette
  float vig = smoothstep(1.4, 0.4, length(uv));
  col = mix(u_bg, col, vig);

  // grain
  float n = (hash(gl_FragCoord.xy + t) - 0.5) * 0.04;
  col += n;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl, src, type) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('shader err', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function hexToRgb(h) {
  const s = h.replace('#', '');
  const v = s.length === 3
    ? s.split('').map((c) => parseInt(c + c, 16))
    : [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return [v[0]/255, v[1]/255, v[2]/255];
}

function ShaderBg({ mode, paletteId, intensity = 1, paused }) {
  const ref = React.useRef(null);
  const stateRef = React.useRef({ mouse: [0, 0], scroll: 0 });

  // mouse + scroll listeners
  React.useEffect(() => {
    const onMove = (e) => { stateRef.current.mouse = [e.clientX, window.innerHeight - e.clientY]; };
    const onScroll = () => { stateRef.current.scroll = window.scrollY; };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const vs = compileShader(gl, SHADER_VS, gl.VERTEX_SHADER);
    const fs = compileShader(gl, SHADER_FS, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('link err', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      mouse: gl.getUniformLocation(prog, 'u_mouse'),
      scroll: gl.getUniformLocation(prog, 'u_scroll'),
      mode: gl.getUniformLocation(prog, 'u_mode'),
      a1: gl.getUniformLocation(prog, 'u_a1'),
      a2: gl.getUniformLocation(prog, 'u_a2'),
      a3: gl.getUniformLocation(prog, 'u_a3'),
      bg: gl.getUniformLocation(prog, 'u_bg'),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth * dpr;
      const h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) {
        c.width = w; c.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    let raf, t0 = performance.now();
    let stop = false;

    const readPalette = () => {
      const cs = getComputedStyle(document.documentElement);
      return {
        a1: hexToRgb(cs.getPropertyValue('--accent-1').trim() || '#ff2e63'),
        a2: hexToRgb(cs.getPropertyValue('--accent-2').trim() || '#00ffd1'),
        a3: hexToRgb(cs.getPropertyValue('--accent-3').trim() || '#ffe600'),
        bg: hexToRgb(cs.getPropertyValue('--bg').trim() || '#0a0a0a'),
      };
    };

    const modeIndex = (m) => ({ metaballs: 0, voronoi: 1, plasma: 2, rings: 3 }[m] ?? 0);

    const draw = () => {
      if (stop) return;
      if (paused) { raf = requestAnimationFrame(draw); return; }
      const t = (performance.now() - t0) / 1000;
      const pal = readPalette();
      gl.uniform2f(u.res, c.width, c.height);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.mouse, stateRef.current.mouse[0] * (window.devicePixelRatio||1),
                            stateRef.current.mouse[1] * (window.devicePixelRatio||1));
      gl.uniform1f(u.scroll, stateRef.current.scroll);
      gl.uniform1i(u.mode, modeIndex(mode));
      gl.uniform3fv(u.a1, pal.a1);
      gl.uniform3fv(u.a2, pal.a2);
      gl.uniform3fv(u.a3, pal.a3);
      gl.uniform3fv(u.bg, pal.bg);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { stop = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [mode, paletteId, paused]);

  return (
    <canvas
      ref={ref}
      className="bg-shader"
      style={{ opacity: intensity }}
    />
  );
}

window.ShaderBg = ShaderBg;
