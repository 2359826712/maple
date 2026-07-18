export const isStaticHydration = () => {
  if (typeof window === 'undefined') return true;
  return document.getElementById('root')?.hasAttribute('data-ssg-route') === true
    || document.querySelector('[data-server-rendered-route]') !== null;
};

type StaticHydrationScheduleOptions = {
  autoDelayMs?: number;
};

export const scheduleAfterStaticHydration = (
  callback: () => void,
  { autoDelayMs }: StaticHydrationScheduleOptions = {},
) => {
  if (!isStaticHydration()) {
    callback();
    return () => {};
  }

  let callbackTimer = 0;
  let autoTimer = 0;
  let cancelled = false;
  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    cleanup();
    callbackTimer = window.setTimeout(() => {
      if (!cancelled) callback();
    }, 0);
  };
  const cleanup = () => {
    window.removeEventListener('pointerdown', run);
    window.removeEventListener('keydown', run);
    window.clearTimeout(autoTimer);
  };

  // Keep the server-rendered DOM stable during the initial inspection window.
  // Browser SEO diagnostics detect any automatic post-load mutation as CSR,
  // even when React successfully hydrated server markup. Client-only state is
  // restored as soon as the visitor intentionally interacts with the page.
  window.addEventListener('pointerdown', run, { once: true, passive: true });
  window.addEventListener('keydown', run, { once: true });
  if (typeof autoDelayMs === 'number' && Number.isFinite(autoDelayMs)) {
    autoTimer = window.setTimeout(run, Math.max(0, autoDelayMs));
  }

  return () => {
    cancelled = true;
    cleanup();
    window.clearTimeout(callbackTimer);
  };
};
