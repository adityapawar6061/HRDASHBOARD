import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const data = err.response?.data;
    const message =
      (typeof data === 'object' && data !== null && (data.error || data.message))
        ? (data.error || data.message)
        : err.message || 'Something went wrong';
    const rejection = new Error(message);
    rejection.status = err.response?.status;
    rejection.data = data;
    return Promise.reject(rejection);
  }
);

export default api;
