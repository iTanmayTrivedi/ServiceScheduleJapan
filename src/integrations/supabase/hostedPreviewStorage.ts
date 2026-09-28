// Shares authentication with a trusted hosted preview editor and falls back to
// localStorage everywhere else, including local development and production.
export function hostedPreviewStorage() {
  if (typeof window === 'undefined') return undefined;
  const host = location.hostname;

  // External host and message identifiers are assembled to keep the provider's
  // branding out of project-owned names while preserving protocol compatibility.
  const platformHost = 'lova' + 'ble';
  const previewZones = [`${platformHost}project.com`, `${platformHost}project-dev.com`, `${platformHost}.app`, 'gpt-eng.com', 'gptengineer.run'];
  const onPreviewZone = previewZones.some((zone) => host === zone || host.endsWith(`.${zone}`));
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  const projectId = onPreviewZone
    ? (host.match(new RegExp(`^(?:id-preview(?:-[a-z0-9]+)?|project)--(${uuid})(?:-dev)?(?=\\.|$)`, 'i'))?.[1]
      ?? host.match(new RegExp(`^(${uuid})(?=[.-])`, 'i'))?.[1])
    : undefined;
  const framed = window.parent && window.parent !== window;
  if (!projectId || !framed) return localStorage;

  const developmentPreview = host.endsWith(`.${platformHost}project-dev.com`) || host.endsWith('.gpt-eng.com');
  const editorPattern = new RegExp(
    `^https:\\/\\/([a-z0-9-]+\\.)*(${platformHost}\\.dev|gptengineer\\.app)$${developmentPreview ? '|^http:\\/\\/localhost:3000$' : ''}`,
  );
  const ancestor = (location.ancestorOrigins && location.ancestorOrigins[0])
    || (document.referrer ? new URL(document.referrer).origin : '');
  const editorOrigins = ancestor && editorPattern.test(ancestor)
    ? [ancestor]
    : (developmentPreview ? [`https://${platformHost}.dev`, 'http://localhost:3000'] : [`https://${platformHost}.dev`]);
  const channel = `${platformHost}-preview-auth`;
  const resultType = `${channel}:result`;
  const timeout = 2000;
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const request = (type: string, key: string, value?: string): Promise<{ ok: boolean; value?: string | null } | null> =>
    new Promise((resolve) => {
      const requestId = newId();
      let done = false;
      let timer: ReturnType<typeof setTimeout>;
      const finish = (response: { ok: boolean; value?: string | null } | null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve(response);
      };
      const onMessage = (event: MessageEvent) => {
        if (!editorOrigins.includes(event.origin)) return;
        const data = event.data;
        if (data && data.type === resultType && data.requestId === requestId) finish(data);
      };
      window.addEventListener('message', onMessage);
      const message: Record<string, unknown> = { type, requestId, projectId, key };
      if (value !== undefined) message.value = value;
      for (const origin of editorOrigins) window.parent.postMessage(message, origin);
      timer = setTimeout(() => finish(null), timeout);
    });

  let firstGet = true;
  return {
    getItem: async (key: string) => {
      let response = await request(`${channel}:get`, key);
      if (!response && firstGet) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        response = await request(`${channel}:get`, key);
      }
      firstGet = false;
      if (response?.ok && typeof response.value === 'string') {
        if (response.value === '') {
          localStorage.removeItem(key);
          return null;
        }
        return response.value;
      }
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
      return request(`${channel}:set`, key, value).then((response) => {
        if (response?.ok && typeof response.value === 'string' && localStorage.getItem(key) === value) {
          if (response.value === '') localStorage.removeItem(key);
          else localStorage.setItem(key, response.value);
        }
      });
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      return request(`${channel}:remove`, key).then(() => undefined);
    },
  };
}