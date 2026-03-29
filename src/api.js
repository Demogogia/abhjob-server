const BASE = import.meta.env.VITE_API_URL || '';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  // Auth
  sendSms:    phone =>              req('POST', '/api/auth/sms/send', { phone }),
  register:   body =>               req('POST', '/api/auth/register', body),
  login:      (phone, password, rememberMe) =>  req('POST', '/api/auth/login', { phone, password, rememberMe }),
  logout:     () =>                 req('POST', '/api/auth/logout'),
  me:         () =>                 req('GET',  '/api/auth/me'),
  updateMe:   body =>               req('PATCH', '/api/auth/me', body),

  // Workers
  getWorkers:    () =>              req('GET',  '/api/workers'),
  createWorker:  body =>            req('POST', '/api/workers', body),
  updateWorker:  (id, body) =>      req('PATCH', `/api/workers/${id}`, body),
  deleteWorker:  id =>              req('DELETE', `/api/workers/${id}`),

  // Orders
  getOrders:     () =>              req('GET',  '/api/orders'),
  createOrder:   worker_id =>       req('POST', '/api/orders', { worker_id }),
  completeOrder: id =>              req('PATCH', `/api/orders/${id}/complete`),

  // Ratings
  getRatings:    () =>              req('GET',  '/api/ratings'),
  createRating:  body =>            req('POST', '/api/ratings', body),

  // Admin
  getUsers:      () =>              req('GET',  '/api/admin/users'),
  approvePhoto:  id =>              req('PATCH', `/api/admin/workers/${id}/approve-photo`),
  verifyWorker:  id =>              req('PATCH', `/api/admin/workers/${id}/verify`),
};
