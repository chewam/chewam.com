// Main App — assembles all modules

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "signal",
  "shaderMode": "metaballs",
  "cursorMode": "trail",
  "shaderIntensity": 0.55,
  "scanlines": true,
  "bgGrid": true,
  "viewTransitions": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [logs, log] = useLogger(80);
  const visible = useVisible();

  // Apply palette class to <html>, optionally with View Transitions
  React.useEffect(() => {
    const apply = () => {
      const cls = document.documentElement.className
        .split(' ')
        .filter((c) => !c.startsWith('palette-'))
        .concat('palette-' + t.palette)
        .join(' ');
      document.documentElement.className = cls;
    };
    if (t.viewTransitions && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }, [t.palette, t.viewTransitions]);

  // Initial logs
  React.useEffect(() => {
    log('info', 'boot · chewam.instrument online');
    log('info', `viewport · ${window.innerWidth}×${window.innerHeight} @ ${window.devicePixelRatio}x`);
    log('info', `timezone · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    if (navigator.connection) log('info', 'navigator.connection · attached');
    if (navigator.getBattery) log('info', 'navigator.getBattery · attached');
    if ('startViewTransition' in document) log('info', 'view-transitions · supported');
    else log('warn', 'view-transitions · not supported in this browser');
    if (typeof navigator.vibrate === 'function') log('info', 'vibration · ok');
    log('info', 'shader · webgl program linked');
  }, []);

  // Mouse / scroll observer logs
  React.useEffect(() => {
    let last = 0;
    const onMove = (e) => {
      const t0 = Date.now();
      if (t0 - last < 1500) return;
      last = t0;
      log('info', `pointer · ${e.clientX},${e.clientY}`);
    };
    const onResize = () => log('warn', `viewport · resized to ${window.innerWidth}×${window.innerHeight}`);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, [log]);

  React.useEffect(() => {
    if (!visible) log('warn', 'visibility · tab backgrounded');
    else log('info', 'visibility · tab restored');
  }, [visible, log]);

  const cyclePalette = () => {
    const i = PALETTES.findIndex((p) => p.id === t.palette);
    const next = PALETTES[(i + 1) % PALETTES.length];
    setTweak('palette', next.id);
    log('info', 'palette · ' + next.id);
  };

  const setPalette = (id) => { setTweak('palette', id); log('info', 'palette · ' + id); };

  // Reveal observer
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="bg-stack">
        <ShaderBg
          mode={t.shaderMode}
          paletteId={t.palette}
          intensity={t.shaderIntensity}
          paused={!visible}
        />
        {t.bgGrid && <div className="bg-grid" />}
        <div className="bg-noise" />
      </div>

      {t.scanlines && <div className="scan" />}

      <CursorFx mode={t.cursorMode} />

      <main className="stage">
        <StatusBar paletteId={t.palette} onCyclePalette={cyclePalette} />
        <Hero />

        <Marquee items={[
          'an ode to the browser',
          'no analytics',
          'no purpose',
          'view-source friendly',
          'made for fun',
          '404 ideas not found',
          'works best on a tuesday',
        ]} />

        <SectionHd idx={1} title="instruments" right={<>{logs.length} events · LIVE</>} />
        <div className="grid">
          <CellBattery />
          <CellNetwork />
          <CellGeo />
          <CellPointer />
          <CellGyro />
          <CellSystem />
          <CellLogger logs={logs} onClear={() => { log('warn', 'tape · wiped'); }} />
          <CellScroll />
          <CellTime />
        </div>

        <SectionHd idx={2} title="controls" right={<>palette · {t.palette}</>} />
        <div className="grid">
          <CellPalette paletteId={t.palette} setPalette={setPalette} />
          <CellKeyboard onLog={log} />
          <CellClipboard onLog={log} />
          <CellVibrate onLog={log} />
        </div>

        <Marquee items={[
          'chewam · chewam · chewam',
          'shaders are friends',
          'turn your phone',
          'press a key',
          'zero dependencies', // (well, react)
          'hosted on vibes',
        ]} />

        <FooterBig />
      </main>

      <TweaksPanel title="Tweaks · /chewam">
        <TweakSection label="Palette" />
        <TweakSelect
          label="Color system"
          value={t.palette}
          options={PALETTES.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakToggle
          label="View Transitions API"
          value={t.viewTransitions}
          onChange={(v) => setTweak('viewTransitions', v)}
        />

        <TweakSection label="Background shader" />
        <TweakSelect
          label="Mode"
          value={t.shaderMode}
          options={SHADER_MODES.map((m) => ({ value: m.id, label: m.name }))}
          onChange={(v) => setTweak('shaderMode', v)}
        />
        <TweakSlider
          label="Intensity"
          value={t.shaderIntensity}
          min={0} max={1} step={0.05}
          onChange={(v) => setTweak('shaderIntensity', v)}
        />
        <TweakToggle
          label="Grid overlay"
          value={t.bgGrid}
          onChange={(v) => setTweak('bgGrid', v)}
        />
        <TweakToggle
          label="CRT scanlines"
          value={t.scanlines}
          onChange={(v) => setTweak('scanlines', v)}
        />

        <TweakSection label="Cursor" />
        <TweakRadio
          label="Mode"
          value={t.cursorMode}
          options={CURSOR_MODES.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(v) => setTweak('cursorMode', v)}
        />
      </TweaksPanel>
    </>
  );
}

// Set initial palette class before mount
document.documentElement.classList.add('palette-' + (TWEAK_DEFAULTS.palette || 'signal'));

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
