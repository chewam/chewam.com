// Shared hooks for browser API integrations

// Real-time clock
function useClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Battery API
function useBattery() {
  const [bat, setBat] = React.useState({
    supported: false, level: null, charging: null,
    chargingTime: null, dischargingTime: null,
  });
  React.useEffect(() => {
    let alive = true;
    let unsubs = [];
    if (!navigator.getBattery) {
      setBat((b) => ({ ...b, supported: false }));
      return;
    }
    navigator.getBattery().then((b) => {
      if (!alive) return;
      const sync = () => setBat({
        supported: true,
        level: b.level,
        charging: b.charging,
        chargingTime: b.chargingTime,
        dischargingTime: b.dischargingTime,
      });
      sync();
      const evts = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
      evts.forEach((e) => { b.addEventListener(e, sync); unsubs.push(() => b.removeEventListener(e, sync)); });
    }).catch(() => setBat((s) => ({ ...s, supported: false })));
    return () => { alive = false; unsubs.forEach((fn) => fn()); };
  }, []);
  return bat;
}

// Network Information API
function useConnection() {
  const get = () => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return { supported: false };
    return {
      supported: true,
      effectiveType: c.effectiveType,
      downlink: c.downlink,
      rtt: c.rtt,
      saveData: c.saveData,
      type: c.type,
    };
  };
  const [info, setInfo] = React.useState(get);
  React.useEffect(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return;
    const onChange = () => setInfo(get());
    c.addEventListener('change', onChange);
    return () => c.removeEventListener('change', onChange);
  }, []);
  return info;
}

// Online status
function useOnline() {
  const [on, setOn] = React.useState(navigator.onLine);
  React.useEffect(() => {
    const a = () => setOn(true);
    const b = () => setOn(false);
    window.addEventListener('online', a);
    window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

// Pointer position
function usePointer() {
  const [p, setP] = React.useState({ x: -9999, y: -9999, hover: false });
  React.useEffect(() => {
    const onMove = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isHover = !!(e.target?.closest && e.target.closest('a, button, [data-hover]'));
      setP({ x: e.clientX, y: e.clientY, hover: isHover });
    };
    const onLeave = () => setP((s) => ({ ...s, x: -9999, y: -9999 }));
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return p;
}

// Scroll
function useScrollY() {
  const [y, setY] = React.useState(0);
  React.useEffect(() => {
    const on = () => setY(window.scrollY);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return y;
}

// Intersection Observer for an element
function useInView(opts = { threshold: 0.15 }) {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, opts);
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

// Geolocation
function useGeolocation(active) {
  const [g, setG] = React.useState({ status: 'idle', coords: null, error: null });
  React.useEffect(() => {
    if (!active) return;
    if (!navigator.geolocation) {
      setG({ status: 'unsupported', coords: null, error: null });
      return;
    }
    setG((s) => ({ ...s, status: 'requesting' }));
    const ok = (pos) => setG({
      status: 'ok',
      coords: {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy,
      },
      error: null,
    });
    const err = (e) => setG({ status: 'denied', coords: null, error: e.message });
    navigator.geolocation.getCurrentPosition(ok, err, { enableHighAccuracy: false, timeout: 8000 });
  }, [active]);
  return g;
}

// Device orientation
function useOrientation() {
  const [o, setO] = React.useState({ supported: false, alpha: 0, beta: 0, gamma: 0, granted: false });
  React.useEffect(() => {
    if (typeof window.DeviceOrientationEvent === 'undefined') return;
    const onO = (e) => setO({
      supported: true,
      alpha: e.alpha || 0,
      beta: e.beta || 0,
      gamma: e.gamma || 0,
      granted: true,
    });
    window.addEventListener('deviceorientation', onO);
    setO((s) => ({ ...s, supported: true }));
    return () => window.removeEventListener('deviceorientation', onO);
  }, []);
  const request = async () => {
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const r = await window.DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return false;
        setO((s) => ({ ...s, granted: true }));
        return true;
      } catch { return false; }
    }
    return true;
  };
  return [o, request];
}

// Logger
function useLogger(max = 80) {
  const [logs, setLogs] = React.useState([]);
  const log = React.useCallback((lvl, msg) => {
    setLogs((prev) => {
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      const ss = String(t.getSeconds()).padStart(2, '0');
      const next = [...prev, { id: t.getTime() + Math.random(), t: `${hh}:${mm}:${ss}`, lvl, msg }];
      if (next.length > max) next.splice(0, next.length - max);
      return next;
    });
  }, [max]);
  return [logs, log];
}

// FPS meter
function useFps() {
  const [fps, setFps] = React.useState(60);
  React.useEffect(() => {
    let raf, last = performance.now(), frames = 0, acc = 0;
    const tick = (t) => {
      const dt = t - last; last = t; acc += dt; frames++;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        acc = 0; frames = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

// Visibility
function useVisible() {
  const [v, setV] = React.useState(!document.hidden);
  React.useEffect(() => {
    const on = () => setV(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return v;
}

Object.assign(window, {
  useClock, useBattery, useConnection, useOnline, usePointer,
  useScrollY, useInView, useGeolocation, useOrientation,
  useLogger, useFps, useVisible,
});
