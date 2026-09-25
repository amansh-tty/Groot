// Serialized into the browser bundle. Keep this function self-contained: no server capabilities.
export function installFeedbackBridge() {
  type Item = {
    id: string;
    elementId?: string;
    selector?: string;
    screen: string;
    state?: string;
    status: string;
  };
  let enabled = false;
  let items: Item[] = [];
  let scenario = { screen: '', state: 'default' };
  let selected: HTMLElement | null = null;
  let lastLocation = '';
  const send = (data: object) =>
    parent.postMessage({ channel: 'playground-preview', ...data }, '*');
  const layer = document.createElement('div');
  layer.dataset.playgroundOverlay = 'true';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646';
  document.body.append(layer);
  const style = document.createElement('style');
  style.textContent = `html.pg-comment-mode #root * {cursor:crosshair!important}
    .pg-feedback-marker{position:fixed;pointer-events:auto;width:24px;height:24px;border-radius:50%;border:2px solid white;background:#20352f;color:white;font:600 12px system-ui;cursor:pointer;box-shadow:0 1px 5px #0005}
    .pg-feedback-marker:focus-visible{outline:3px solid #985128;outline-offset:2px}
    .pg-feedback-highlight{position:fixed;pointer-events:none;border:2px solid #306950;border-radius:4px;background:#3069500d;box-sizing:border-box}`;
  document.head.append(style);
  const currentScreen = () =>
    document.querySelector('[data-playground-screen]')?.getAttribute('data-playground-screen') ||
    scenario.screen;
  function find(item: Item) {
    try {
      return item.elementId
        ? document.querySelector<HTMLElement>(
            '[data-playground-id="' + CSS.escape(item.elementId) + '"]',
          )
        : item.selector
          ? document.querySelector<HTMLElement>(item.selector)
          : null;
    } catch {
      return null;
    }
  }
  function path(element: HTMLElement) {
    if (element.id) return '#' + CSS.escape(element.id);
    const parts: string[] = [];
    let node: HTMLElement | null = element;
    while (node && node.id !== 'root' && parts.length < 12) {
      const index = node.parentElement ? [...node.parentElement.children].indexOf(node) + 1 : 1;
      parts.unshift(node.tagName.toLowerCase() + ':nth-child(' + index + ')');
      node = node.parentElement;
    }
    return '#root > ' + parts.join(' > ');
  }
  function choose(element: HTMLElement) {
    selected = element;
    const elementId = element.dataset.playgroundId || '';
    send({
      type: 'element-selected',
      target: {
        element: elementId || element.tagName.toLowerCase(),
        elementId,
        component: element.dataset.playgroundComponent || '',
        label: (
          element.getAttribute('aria-label') ||
          element.innerText ||
          element.getAttribute('placeholder') ||
          ''
        ).slice(0, 200),
        selector: path(element),
        screen: currentScreen(),
        state: scenario.state,
      },
    });
    render();
  }
  function render() {
    const location = currentScreen() + ':' + scenario.state;
    if (location !== lastLocation) {
      lastLocation = location;
      send({ type: 'location', screen: currentScreen(), state: scenario.state });
    }
    layer.replaceChildren();
    if (!enabled) return;
    if (selected?.isConnected) {
      const rect = selected.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'pg-feedback-highlight';
      Object.assign(highlight.style, {
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
      });
      layer.append(highlight);
    }
    const offsets = new Map<HTMLElement, number>();
    items.forEach((item, index) => {
      if (
        item.status !== 'open' ||
        (item.screen && item.screen !== currentScreen()) ||
        (item.state || 'default') !== scenario.state
      )
        return;
      const element = find(item);
      if (!element || !element.getClientRects().length) return;
      const rect = element.getBoundingClientRect();
      const offset = offsets.get(element) || 0;
      offsets.set(element, offset + 26);
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const marker = document.createElement('button');
      marker.className = 'pg-feedback-marker';
      marker.textContent = String(index + 1);
      marker.setAttribute('aria-label', 'Open feedback ' + (index + 1));
      marker.style.left = Math.max(0, Math.min(innerWidth - 26, rect.right - 8 - offset)) + 'px';
      marker.style.top = Math.max(0, rect.top - 10) + 'px';
      marker.onclick = () => send({ type: 'feedback-open', id: item.id });
      layer.append(marker);
    });
  }
  document.addEventListener(
    'click',
    (event) => {
      if (!enabled || !(event.target instanceof Element) || layer.contains(event.target)) return;
      const element = event.target.closest<HTMLElement>(
        '[data-playground-id],button,a,input,select,textarea,h1,h2,h3,label',
      );
      if (!element || !document.getElementById('root')?.contains(element)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      choose(element);
    },
    true,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (enabled && event.key === 'Escape') send({ type: 'feedback-exit' });
      if (
        enabled &&
        (event.key === 'Enter' || event.key === ' ') &&
        event.target instanceof HTMLElement &&
        !layer.contains(event.target)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        choose(event.target);
      }
    },
    true,
  );
  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.data?.channel !== 'playground-host') return;
    const data = event.data;
    if (data.type === 'select') {
      scenario = { screen: String(data.screen || ''), state: String(data.state || 'default') };
      selected = null;
    }
    if (data.type === 'feedback') {
      enabled = data.enabled === true;
      items = Array.isArray(data.items) ? data.items.slice(0, 500) : [];
      document.documentElement.classList.toggle('pg-comment-mode', enabled);
      if (!enabled) selected = null;
    }
    if (data.type === 'feedback-focus') {
      const item = items.find((i) => i.id === data.id);
      const element = item && find(item);
      if (element) {
        selected = element;
        element.scrollIntoView({ block: 'center' });
      } else
        send({
          type: 'feedback-missing',
          message:
            'Element not found in this screen. Its source may have changed; use the saved label and selector.',
        });
    }
    render();
  });
  let queued = false;
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        render();
      });
    }
  };
  new MutationObserver(schedule).observe(document.getElementById('root')!, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
}
