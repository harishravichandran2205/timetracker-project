import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9090/api', // Your Spring Boot URL
});

// Request Interceptor (Adds your token to every request)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor (Handles the Errors)
api.interceptors.response.use(
  (response) => response, // If request is successful, just return it
  (error) => {
    const { status } = error.response;

    if (status === 401) {
      // SESSION EXPIRED / UNAUTHORIZED
      console.warn("Session expired. Logging out...");
      localStorage.clear();
      sessionStorage.setItem(
          "warningMessage",
          "Your session has expired. Please log in again."
        );
      window.location.href = '/login';
    }

    if (status === 404) {
      // NOT FOUND
      console.error("The requested resource was not found (404).");
      // Optional: window.location.href = '/404';
    }

    return Promise.reject(error);
  }
);

export default api;