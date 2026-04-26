// All readout / instrument modules

// ─── Top status bar ───────────────────────────────────────────
function StatusBar({ paletteId, onCyclePalette }) {
  const now = useClock();
  const fps = useFps();
  const online = useOnline();
  const conn = useConnection();
  const visible = useVisible();

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return (
    <header className="bar">
      <div className="bar-mark">CHEW<span>·</span>AM</div>
      <div className="bar-sep" />
      <div className="bar-stat">
        <span><b>SYS</b> ONLINE</span>
        <span>NET <b style={{ color: online ? 'var(--accent-2)' : 'var(--accent-1)' }}>{online ? 'UP' : 'DOWN'}</b></span>
        {conn.supported && <span>LINK <b>{(conn.effectiveType || '?').toUpperCase()}</b></span>}
        <span>FPS <b>{fps}</b></span>
        <span>FOCUS <b style={{ color: visible ? 'var(--accent-2)' : 'var(--accent-3)' }}>{visible ? 'YES' : 'AFK'}</b></span>
      </div>
      <div className="bar-sep" />
      <button
        className="btn ghost"
        style={{ padding: '6px 10px', border: 'none', textTransform: 'uppercase' }}
        onClick={onCyclePalette}
        data-hover
      >▣ {paletteId}</button>
      <div className="bar-sep" />
      <div className="bar-clock">{hh}:{mm}:{ss}</div>
    </header>
  );
}

// ─── Hero with hover-reactive title ──────────────────────────
function Hero() {
  const text = 'chewam';
  const [hot, setHot] = React.useState(-1);
  const handleMove = (e) => {
    const spans = e.currentTarget.querySelectorAll('.glyph');
    let best = -1, bestD = 1e9;
    spans.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (d < bestD) { bestD = d; best = i; }
    });
    setHot(bestD < 120 ? best : -1);
  };
  return (
    <section className="hero">
      <div className="hero-meta">
        <span><b>HOME</b> · /index.html · build 2026.04</span>
        <span>SCROLL ↓ TO INSTRUMENT</span>
      </div>
      <h1 className="hero-title" onPointerMove={handleMove} onPointerLeave={() => setHot(-1)}>
        {text.split('').map((c, i) => (
          <span key={i} className="glyph" data-hot={hot === i ? '1' : '0'}>{c}</span>
        ))}
        <span className="dot" />
      </h1>
      <div className="hero-sub">
        <p className="hero-tag">
          A home page that does <em>nothing useful</em>. Just an excuse to plug
          every browser API into a single document and see what happens. The page
          knows the time, the weather of your network, the orientation of your
          phone — and renders itself with shaders. Move the mouse. Scroll. Tilt.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#instrument" data-hover>ENTER INSTRUMENT →</a>
          <a className="btn" href="https://github.com/chewam" target="_blank" rel="noopener" data-hover>GITHUB</a>
        </div>
      </div>
    </section>
  );
}

// ─── Section header utility ──────────────────────────────────
function SectionHd({ idx, title, right }) {
  return (
    <div className="section-hd" id={idx === 1 ? 'instrument' : undefined}>
      <div>
        <h2><i>{String(idx).padStart(2, '0')}</i>{title}</h2>
      </div>
      <div className="right">{right}</div>
    </div>
  );
}

// ─── Marquee ─────────────────────────────────────────────────
function Marquee({ items }) {
  const block = (k) => (
    <span key={k}>
      {items.map((s, i) => (
        <React.Fragment key={i}>
          {s}
          <i className={'sep' + (i % 3 === 1 ? ' alt' : i % 3 === 2 ? ' alt2' : '')} />
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {block('a')}
        {block('b')}
      </div>
    </div>
  );
}

// ─── Battery + Network cell ──────────────────────────────────
function CellBattery() {
  const bat = useBattery();
  const lvl = bat.level == null ? null : Math.round(bat.level * 100);
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>01 · BATTERY</b>
        <span className={'pill ' + (bat.supported ? 'live' : 'warn')}>
          {bat.supported ? (bat.charging ? 'CHARGING' : 'DRAIN') : 'N/A'}
        </span>
      </div>
      <span className="cell-idx">navigator.getBattery</span>
      <svg className="batt" viewBox="0 0 100 40" preserveAspectRatio="none">
        <rect x="1" y="1" width="92" height="38" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="93" y="13" width="6" height="14" fill="currentColor" />
        {lvl != null && (
          <rect
            x="4" y="4" width={lvl * 0.86} height="32"
            fill={lvl < 20 ? 'var(--accent-1)' : lvl < 50 ? 'var(--accent-3)' : 'var(--accent-2)'}
          />
        )}
        {[20, 40, 60, 80].map((p) => (
          <line key={p} x1={4 + p * 0.86} y1="6" x2={4 + p * 0.86} y2="34" stroke="var(--bg)" strokeWidth="0.5" />
        ))}
      </svg>
      <div className="readout">
        {lvl != null ? lvl : '--'}<span className="unit">%</span>
        <small>{bat.charging ? 'POWER IN' : bat.supported ? 'AUTONOMOUS' : 'API UNSUPPORTED'}</small>
      </div>
    </div>
  );
}

function CellNetwork() {
  const conn = useConnection();
  const online = useOnline();
  const bars = (() => {
    const t = (conn.effectiveType || '').toLowerCase();
    if (!online) return 0;
    if (t === 'slow-2g') return 1;
    if (t === '2g') return 2;
    if (t === '3g') return 3;
    if (t === '4g') return 5;
    return 4;
  })();
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>02 · NETWORK</b>
        <span className={'pill ' + (online ? 'live' : 'err')}>{online ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
      <span className="cell-idx">navigator.connection</span>
      <div className="conn-bars">
        {[1,2,3,4,5].map((i) => (
          <i key={i} className={i <= bars ? '' : 'off'} style={{ height: `${i * 18}%` }} />
        ))}
      </div>
      <dl className="kv">
        <dt>type</dt><dd>{conn.effectiveType || '—'}</dd>
        <dt>down</dt><dd>{conn.downlink != null ? conn.downlink + ' mbps' : '—'}</dd>
        <dt>rtt</dt><dd>{conn.rtt != null ? conn.rtt + ' ms' : '—'}</dd>
        <dt>save</dt><dd>{conn.saveData ? 'yes' : 'no'}</dd>
      </dl>
    </div>
  );
}

// ─── Geolocation cell ────────────────────────────────────────
function CellGeo() {
  const [active, setActive] = React.useState(false);
  const g = useGeolocation(active);
  const lat = g.coords?.lat;
  const lon = g.coords?.lon;
  // project lat/lon to a flat world map (simple equirectangular)
  const px = lon != null ? ((lon + 180) / 360) * 100 : 50;
  const py = lat != null ? ((90 - lat) / 180) * 100 : 50;
  return (
    <div className="cell span-6">
      <div className="cell-hd">
        <b>03 · GEOLOCATION</b>
        <span className={'pill ' + (g.status === 'ok' ? 'live' : g.status === 'denied' ? 'err' : '')}>
          {g.status.toUpperCase()}
        </span>
      </div>
      <span className="cell-idx">navigator.geolocation</span>
      <div className="map-wrap">
        <svg viewBox="0 0 360 180" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.6" fill="var(--fg-dim)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="360" height="180" fill="url(#dots)" />
          {/* schematic continents */}
          <g fill="none" stroke="var(--fg)" strokeWidth="0.6" opacity="0.6">
            <path d="M40 60 Q70 40 100 55 T160 70 Q140 95 110 100 T55 110 Z" />
            <path d="M170 70 Q200 50 235 65 Q255 80 250 110 Q220 130 190 115 Q175 100 170 70 Z" />
            <path d="M260 90 Q290 70 320 80 Q335 105 320 130 Q290 140 270 120 Z" />
            <path d="M120 130 Q140 120 165 130 Q170 145 150 155 Q130 150 120 130 Z" />
          </g>
          <line x1="0" y1="90" x2="360" y2="90" stroke="var(--fg-dim)" strokeWidth="0.3" strokeDasharray="2 2" />
          <line x1="180" y1="0" x2="180" y2="180" stroke="var(--fg-dim)" strokeWidth="0.3" strokeDasharray="2 2" />
          {g.status === 'ok' && (
            <g>
              <line x1={px} y1="0" x2={px} y2="180" stroke="var(--accent-1)" strokeWidth="0.4" />
              <line x1="0" y1={py} x2="360" y2={py} stroke="var(--accent-1)" strokeWidth="0.4" />
              <circle cx={px} cy={py} r="2" fill="var(--accent-1)" />
              <circle cx={px} cy={py} r="6" fill="none" stroke="var(--accent-1)" strokeWidth="0.5">
                <animate attributeName="r" from="2" to="14" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </svg>
      </div>
      <dl className="kv" style={{ gridTemplateColumns: 'repeat(4, max-content 1fr)' }}>
        <dt>lat</dt><dd><b>{lat != null ? lat.toFixed(4) + '°' : '—'}</b></dd>
        <dt>lon</dt><dd><b>{lon != null ? lon.toFixed(4) + '°' : '—'}</b></dd>
        <dt>±</dt><dd>{g.coords?.acc ? Math.round(g.coords.acc) + 'm' : '—'}</dd>
        <dt>tz</dt><dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
      </dl>
      {!active && (
        <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={() => setActive(true)} data-hover>
          PING SATELLITE
        </button>
      )}
      {g.status === 'denied' && (
        <span style={{ color: 'var(--accent-1)', fontSize: 11 }}>// access denied — running blind</span>
      )}
    </div>
  );
}

// ─── Pointer / cursor cell ───────────────────────────────────
function CellPointer() {
  const p = usePointer();
  const [trail, setTrail] = React.useState([]);
  React.useEffect(() => {
    setTrail((t) => {
      const next = [...t, { x: p.x, y: p.y, ts: Date.now() }].slice(-30);
      return next;
    });
  }, [p.x, p.y]);
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>04 · POINTER</b>
        <span className="pill live">TRACKED</span>
      </div>
      <span className="cell-idx">pointermove</span>
      <div className="readout">
        {p.x < 0 ? '----' : String(Math.round(p.x)).padStart(4, '0')}
        <span style={{ color: 'var(--fg-dim)', fontSize: '0.4em', margin: '0 6px' }}>×</span>
        {p.y < 0 ? '----' : String(Math.round(p.y)).padStart(4, '0')}
        <small>SCREEN COORDINATES · PX</small>
      </div>
      <dl className="kv">
        <dt>vp</dt><dd>{window.innerWidth}×{window.innerHeight}</dd>
        <dt>dpr</dt><dd>{window.devicePixelRatio}</dd>
        <dt>hover</dt><dd>{p.hover ? <b>YES</b> : 'no'}</dd>
      </dl>
    </div>
  );
}

// ─── Gyroscope cell ──────────────────────────────────────────
function CellGyro() {
  const [o, request] = useOrientation();
  // Map beta (front-back, -180..180) and gamma (left-right, -90..90) to ball offset
  const isMobile = matchMedia('(hover: none)').matches;
  const offX = Math.max(-1, Math.min(1, (o.gamma || 0) / 45));
  const offY = Math.max(-1, Math.min(1, (o.beta || 0) / 45));
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>05 · GYROSCOPE</b>
        <span className={'pill ' + (o.granted ? 'live' : 'warn')}>
          {o.granted ? 'STREAM' : isMobile ? 'TAP' : 'DESKTOP'}
        </span>
      </div>
      <span className="cell-idx">deviceorientation</span>
      <div className="gyro-stage">
        <div className="gyro-cross" />
        <div className="gyro-ring" />
        <div
          className="gyro-ball"
          style={{ transform: `translate(${offX * 80}px, ${offY * 60}px)` }}
        />
      </div>
      <dl className="kv">
        <dt>α</dt><dd>{Math.round(o.alpha || 0)}°</dd>
        <dt>β</dt><dd>{Math.round(o.beta || 0)}°</dd>
        <dt>γ</dt><dd>{Math.round(o.gamma || 0)}°</dd>
      </dl>
      {!o.granted && isMobile && (
        <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={request} data-hover>
          REQUEST GYRO
        </button>
      )}
    </div>
  );
}

// ─── System / UA cell ────────────────────────────────────────
function CellSystem() {
  const [info] = React.useState(() => {
    const ua = navigator.userAgent;
    const get = (re) => (ua.match(re) || [, '?'])[1];
    return {
      browser:
        /Firefox\/[\d.]+/.test(ua) ? get(/Firefox\/([\d.]+)/) && 'Firefox ' + get(/Firefox\/([\d.]+)/) :
        /Edg\//.test(ua)    ? 'Edge ' + get(/Edg\/([\d.]+)/) :
        /Chrome\//.test(ua) ? 'Chrome ' + get(/Chrome\/([\d.]+)/) :
        /Safari\//.test(ua) ? 'Safari ' + get(/Version\/([\d.]+)/) :
        'unknown',
      platform: navigator.platform || navigator.userAgentData?.platform || '?',
      cores: navigator.hardwareConcurrency || '?',
      mem: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '?',
      lang: navigator.language,
      cookies: navigator.cookieEnabled ? 'on' : 'off',
      touch: 'ontouchstart' in window ? 'yes' : 'no',
      protocol: location.protocol.replace(':', ''),
    };
  });
  return (
    <div className="cell span-6">
      <div className="cell-hd">
        <b>06 · SYSTEM PROFILE</b>
        <span className="pill">SNIFFED</span>
      </div>
      <span className="cell-idx">navigator.* / window.*</span>
      <dl className="kv" style={{ gridTemplateColumns: 'repeat(2, max-content 1fr)' }}>
        <dt>ua</dt><dd><b>{info.browser}</b></dd>
        <dt>os</dt><dd>{info.platform}</dd>
        <dt>cores</dt><dd>{info.cores}</dd>
        <dt>mem</dt><dd>{info.mem}</dd>
        <dt>lang</dt><dd>{info.lang}</dd>
        <dt>touch</dt><dd>{info.touch}</dd>
        <dt>cookies</dt><dd>{info.cookies}</dd>
        <dt>scheme</dt><dd>{info.protocol}</dd>
      </dl>
      <div className="ascii">{`
  ╔══ profile / locked ═══════════════════╗
  ║  no analytics. no tracker. no point.  ║
  ╚═══════════════════════════════════════╝`}</div>
    </div>
  );
}

// ─── Logger cell ─────────────────────────────────────────────
function CellLogger({ logs, onClear }) {
  return (
    <div className="cell span-6">
      <div className="cell-hd">
        <b>07 · EVENT TAPE</b>
        <span className="pill live">REC · {logs.length}</span>
      </div>
      <span className="cell-idx">window.events</span>
      <div className="logger" style={{ minHeight: 220 }}>
        <ul>
          {logs.slice(-40).map((l) => (
            <li key={l.id}>
              <time>{l.t}</time>
              <span className={'lvl ' + l.lvl}>{l.lvl.toUpperCase()}</span>
              <span className="msg">{l.msg}</span>
            </li>
          ))}
        </ul>
      </div>
      <button className="btn ghost" style={{ alignSelf: 'flex-start', fontSize: 10 }} onClick={onClear} data-hover>
        WIPE TAPE
      </button>
    </div>
  );
}

// ─── Scroll cell ─────────────────────────────────────────────
function CellScroll() {
  const y = useScrollY();
  const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
  const pct = Math.min(100, Math.max(0, (y / max) * 100));
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>08 · SCROLL DEPTH</b>
        <span className="pill">FLIP</span>
      </div>
      <span className="cell-idx">scroll-driven</span>
      <div className="readout">
        {pct.toFixed(0)}<span className="unit">%</span>
        <small>page traversed</small>
      </div>
      <div className="barbar"><i style={{ width: pct + '%' }} /></div>
      <dl className="kv">
        <dt>y</dt><dd>{Math.round(y)}px</dd>
        <dt>max</dt><dd>{Math.round(max)}px</dd>
      </dl>
    </div>
  );
}

// ─── Time / Locale cell ──────────────────────────────────────
function CellTime() {
  const now = useClock();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Sun position: simple time-of-day -> angle
  const ms = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const dayPct = ms / 86400; // 0..1
  const sunAngle = -Math.PI / 2 + dayPct * Math.PI * 2;
  const cx = 50 + Math.cos(sunAngle) * 36;
  const cy = 50 + Math.sin(sunAngle) * 36;
  const isDay = sunAngle > -Math.PI && sunAngle < 0;
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>09 · CHRONOMETER</b>
        <span className="pill live">{isDay ? 'DAY' : 'NIGHT'}</span>
      </div>
      <span className="cell-idx">Date · Intl</span>
      <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 180, alignSelf: 'center' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--hairline)" strokeWidth="0.5" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="var(--hairline)" strokeWidth="0.3" strokeDasharray="2 2" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="var(--hairline)" strokeWidth="0.3" strokeDasharray="2 2" />
        <circle cx={cx} cy={cy} r="4" fill={isDay ? 'var(--accent-3)' : 'var(--accent-2)'} />
        <text x="50" y="54" textAnchor="middle" fontSize="10" fill="var(--fg)" fontWeight="700"
              fontFamily="JetBrains Mono">
          {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}
        </text>
      </svg>
      <dl className="kv">
        <dt>tz</dt><dd>{tz}</dd>
        <dt>off</dt><dd>{-now.getTimezoneOffset() / 60}h</dd>
      </dl>
    </div>
  );
}

// ─── Color picker / palette cell ─────────────────────────────
function CellPalette({ paletteId, setPalette }) {
  return (
    <div className="cell span-6">
      <div className="cell-hd">
        <b>10 · PALETTE INJECTOR</b>
        <span className="pill warn">CSS VAR</span>
      </div>
      <span className="cell-idx">--accent-*</span>
      <p style={{ fontSize: 12, color: 'var(--fg-dim)', maxWidth: '50ch', margin: 0 }}>
        Five hand-picked color systems. Click to inject — every shader, particle and accent
        re-tunes itself in place. View Transitions API smooths the swap.
      </p>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        {PALETTES.map((p) => {
          const active = p.id === paletteId;
          return (
            <button
              key={p.id}
              onClick={() => setPalette(p.id)}
              data-hover
              className="btn"
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8, padding: 10,
                borderColor: active ? 'var(--accent-2)' : 'var(--hairline)',
                background: active ? 'color-mix(in srgb, var(--accent-2) 12%, transparent)' : 'transparent',
              }}
            >
              <PaletteSwatch palette={p.id} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <b style={{ fontSize: 11 }}>{p.name}</b>
                <span style={{ fontSize: 9, color: 'var(--fg-dim)', textTransform: 'none', letterSpacing: 0 }}>{p.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PaletteSwatch({ palette }) {
  // Render a tiny inline preview using the same vars as the real palettes
  const map = {
    signal:  ['#0a0a0a', '#ff2e63', '#00ffd1', '#ffe600'],
    plasma:  ['#07051a', '#ff00aa', '#00e5ff', '#ffd400'],
    haz:     ['#0c0a00', '#ffe600', '#ff7a00', '#ff2e63'],
    acid:    ['#f4f3ee', '#ff3d00', '#2962ff', '#00c853'],
    mono:    ['#0a0a0a', '#f5f5f0', '#f5f5f0', '#f5f5f0'],
  }[palette] || ['#000','#fff','#fff','#fff'];
  return (
    <div style={{ display: 'flex', width: '100%', height: 18, border: '1px solid var(--hairline)' }}>
      {map.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
    </div>
  );
}

// ─── Keyboard cell ───────────────────────────────────────────
function CellKeyboard({ onLog }) {
  const [hot, setHot] = React.useState(null);
  const [last, setLast] = React.useState('—');
  React.useEffect(() => {
    const onDown = (e) => {
      setHot(e.key.toLowerCase());
      setLast(e.key);
      onLog && onLog('info', `keydown · ${e.key} (code: ${e.code})`);
    };
    const onUp = () => setTimeout(() => setHot(null), 120);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onLog]);
  const row1 = 'qwertyuiop'.split('');
  const row2 = 'asdfghjkl'.split('');
  const row3 = 'zxcvbnm'.split('');
  return (
    <div className="cell span-6">
      <div className="cell-hd">
        <b>11 · KEYBOARD</b>
        <span className="pill">PRESS ANY KEY</span>
      </div>
      <span className="cell-idx">keydown · keyup</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="keys">{row1.map((k) => <i key={k} className={hot === k ? 'hot' : ''}>{k}</i>)}</div>
        <div className="keys" style={{ marginLeft: '5%' }}>{row2.map((k) => <i key={k} className={hot === k ? 'hot' : ''}>{k}</i>)}</div>
        <div className="keys" style={{ marginLeft: '10%' }}>{row3.map((k) => <i key={k} className={hot === k ? 'hot' : ''}>{k}</i>)}</div>
      </div>
      <div className="readout" style={{ fontSize: '2rem' }}>
        {last}
        <small>last key captured</small>
      </div>
    </div>
  );
}

// ─── Clipboard / share cell ──────────────────────────────────
function CellClipboard({ onLog }) {
  const [copied, setCopied] = React.useState(false);
  const phrase = 'i was here. — chewam.com';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      onLog && onLog('info', 'clipboard · wrote ' + phrase.length + ' bytes');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      onLog && onLog('err', 'clipboard · permission denied');
    }
  };
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>12 · CLIPBOARD</b>
        <span className={'pill ' + (copied ? 'live' : '')}>{copied ? 'WRITTEN' : 'IDLE'}</span>
      </div>
      <span className="cell-idx">navigator.clipboard</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
        <div className="ascii" style={{ fontSize: 11, color: 'var(--fg)' }}>{`> ${phrase}`}</div>
        <button className="btn primary" onClick={copy} data-hover>
          {copied ? '✓ COPIED' : '◎ COPY TO CLIPBOARD'}
        </button>
      </div>
    </div>
  );
}

// ─── Vibration cell ──────────────────────────────────────────
function CellVibrate({ onLog }) {
  const supported = typeof navigator.vibrate === 'function';
  const trigger = (pat) => {
    if (!supported) {
      onLog && onLog('warn', 'vibration · not supported on this device');
      return;
    }
    navigator.vibrate(pat);
    onLog && onLog('info', 'vibration · pattern ' + JSON.stringify(pat));
  };
  return (
    <div className="cell span-3">
      <div className="cell-hd">
        <b>13 · HAPTICS</b>
        <span className={'pill ' + (supported ? 'live' : 'warn')}>{supported ? 'READY' : 'N/A'}</span>
      </div>
      <span className="cell-idx">navigator.vibrate</span>
      <p style={{ fontSize: 11, color: 'var(--fg-dim)', margin: 0 }}>
        Mobile only. Try it on your phone.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="btn" onClick={() => trigger(40)} data-hover>· TAP</button>
        <button className="btn" onClick={() => trigger([60, 40, 60])} data-hover>·· DOUBLE</button>
        <button className="btn" onClick={() => trigger([20, 30, 20, 30, 20, 30, 200])} data-hover>·····— S.O.S</button>
      </div>
    </div>
  );
}

// ─── Stamp / footer big text ─────────────────────────────────
function FooterBig() {
  const [year] = React.useState(() => new Date().getFullYear());
  return (
    <footer className="foot">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <span>END OF TRANSMISSION</span>
        <div className="stamp">© {year} · NO RIGHTS RESERVED</div>
      </div>
      <div className="foot-big">chewam<span style={{ color: 'var(--accent-1)' }}>.</span></div>
      <div className="foot-grid">
        <div><b>CONTACT</b><br />carrier pigeon</div>
        <div><b>STATUS</b><br />0 products shipped</div>
        <div><b>BUILD</b><br />2026.04.26 · v∞</div>
        <div><b>UPTIME</b><br />since you opened the tab</div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  StatusBar, Hero, SectionHd, Marquee,
  CellBattery, CellNetwork, CellGeo, CellPointer, CellGyro,
  CellSystem, CellLogger, CellScroll, CellTime, CellPalette,
  CellKeyboard, CellClipboard, CellVibrate, FooterBig,
});
