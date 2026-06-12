import axios from 'axios';

/**
 * Axios instance for all admin-portal API calls.
 * Uses pf_admin_token (separate from the regular user token).
 */
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('pf_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the stored token so the login page is shown
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pf_admin_token');
      localStorage.removeItem('pf_admin_user');
    }
    return Promise.reject(err);
  }
);

export default adminApi;
