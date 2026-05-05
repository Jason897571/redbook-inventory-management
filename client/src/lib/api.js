const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Materials
  getMaterials: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/materials${query ? '?' + query : ''}`);
  },
  getMaterial: (id) => request(`/materials/${id}`),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  stockInMaterial: (id, data) => request(`/materials/${id}/stock`, { method: 'POST', body: JSON.stringify(data) }),

  // Series
  getSeries: () => request('/series'),
  createSeries: (data) => request('/series', { method: 'POST', body: JSON.stringify(data) }),
  updateSeries: (id, data) => request(`/series/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSeries: (id) => request(`/series/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? '?' + query : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Semi-Products
  getSemiProducts: () => request('/semi-products'),
  getSemiProduct: (id) => request(`/semi-products/${id}`),
  createSemiProduct: (data) => request('/semi-products', { method: 'POST', body: JSON.stringify(data) }),
  updateSemiProduct: (id, data) => request(`/semi-products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSemiProduct: (id) => request(`/semi-products/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? '?' + query : ''}`);
  },
  getSalesSummary: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales/summary${query ? '?' + query : ''}`);
  },
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  // Stock Logs
  getStockLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stock-logs${query ? '?' + query : ''}`);
  },

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
