const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = {
  async request(config: any) {
    const headers: any = { ...config.headers };

    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      const token = (globalThis as any).localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${baseURL}${config.url}`, {
      method: config.method || 'GET',
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });
    return response.json();
  },
  get(url: string, config?: any) {
    return this.request({ ...config, url, method: 'GET' });
  },
  post(url: string, data?: any, config?: any) {
    return this.request({ ...config, url, data, method: 'POST' });
  },
  put(url: string, data?: any, config?: any) {
    return this.request({ ...config, url, data, method: 'PUT' });
  },
  delete(url: string, config?: any) {
    return this.request({ ...config, url, method: 'DELETE' });
  },
  
  patch(url: string, data?: any, config?: any) {
  return this.request({ ...config, url, data, method: 'PATCH' });
},
};


export default api;
