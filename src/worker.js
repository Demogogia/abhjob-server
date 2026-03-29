const BACKEND = 'https://abhjob-server-production.up.railway.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy all /api/* requests to the backend
    if (url.pathname.startsWith('/api/')) {
      const target = BACKEND + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete('host');

      const proxyReq = new Request(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      });

      const response = await fetch(proxyReq);

      // Forward response as-is (including Set-Cookie)
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  },
};
