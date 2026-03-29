const BACKEND = 'https://abhjob-server-production.up.railway.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy all /api/* requests to the backend
    if (url.pathname.startsWith('/api/')) {
      const target = BACKEND + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete('host');

      return fetch(new Request(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      }));
    }

    // Serve static assets for everything else
    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';"
    );
    return new Response(response.body, { status: response.status, headers: newHeaders });
  },
};
