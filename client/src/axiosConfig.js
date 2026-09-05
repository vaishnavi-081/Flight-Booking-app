import axios from 'axios';
import { notify } from './utils/notify';

// Set default authorization header synchronously if token is already present
const initialToken = localStorage.getItem('token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Request interceptor: attach current auth token to every outgoing request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      if (hadToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        delete axios.defaults.headers.common['Authorization'];
        notify('Session expired or unauthorized. Please log in again.', 'error');
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          setTimeout(() => {
            window.location.href = '/auth';
          }, 1200);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
