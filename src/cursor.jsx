// Cursor + particle trail (Canvas 2D)

function CursorFx({ mode }) {
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const trailRef = React.useRef(null);

  React.useEffect(() => {
    if (mode === 'native') return;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    let raf;
    const onMove = (e) => {
      rx = e.clientX; ry = e.clientY;
      const isHover = !!(e.target?.closest && e.target.closest('a, button, [data-hover]'));
      if (ringRef.current) ringRef.current.classList.toggle('hover', isHover);
    };
    const tick = () => {
      tx += (rx - tx) * 0.18;
      ty += (ry - ty) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  // Trail particles
  React.useEffect(() => {
    if (mode !== 'trail') return;
    const c = trailRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + 'px';
      c.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    const particles = [];
    const onMove = (e) => {
      const cs = getComputedStyle(document.documentElement);
      const colors = [
        cs.getPropertyValue('--accent-1').trim(),
        cs.getPropertyValue('--accent-2').trim(),
        cs.getPropertyValue('--accent-3').trim(),
      ];
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: e.clientX * dpr, y: e.clientY * dpr,
          vx: (Math.random() - 0.5) * 1.5 * dpr,
          vy: (Math.random() - 0.5) * 1.5 * dpr - 0.4 * dpr,
          life: 1, color: colors[Math.floor(Math.random() * colors.length)],
          size: (1 + Math.random() * 2.5) * dpr,
        });
      }
      if (particles.length > 400) particles.splice(0, particles.length - 400);
    };
    window.addEventListener('pointermove', onMove);
    let raf, stop = false;
    const tick = () => {
      if (stop) return;
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  if (mode === 'native') return null;
  return (
    <>
      {mode === 'trail' && (
        <canvas
          ref={trailRef}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99 }}
        />
      )}
      {mode === 'ring' && <div ref={ringRef} className="cursor-ring" />}
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

window.CursorFx = CursorFx;
