import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Step 1: Attach the Access Token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Step 2: Handle "401 Unauthorized" by refreshing the token
api.interceptors.response.use(
  (response) => response, // If request succeeds, just return the response
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Hit the Django SimpleJWT refresh endpoint
          const response = await axios.post('http://127.0.0.1:8000/api/auth/refresh/', {
            refresh: refreshToken,
          });

          // Store the new access token
          localStorage.setItem('access_token', response.data.access);

          // Update the header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token is also expired, kick them to login
          console.error("Refresh token expired. Logging out...");
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;