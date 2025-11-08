// src/services/api.js
import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";

// Use environment variables for backend URLs
const baseURL = isProduction
  ? process.env.REACT_APP_BACKEND_URL_PROD
  : process.env.REACT_APP_BACKEND_URL;

// Create an Axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: 10000, // Increased timeout, 1 second might be too short
  headers: { "Content-Type": "application/json" },
});

// Add a request interceptor to include the access token
api.interceptors.request.use(
  (config) => {
    // Get the access token from localStorage
    const accessToken = localStorage.getItem("access_token");

    // If the token exists, add the Authorization header
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// This will automatically try to refresh the token if a 401 error occurs
// and the token is potentially expired.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 Unauthorized and not a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request as being retried

      try {
        // Attempt to get the refresh token from localStorage
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          // Make a request to your token refresh endpoint
          const refreshResponse = await axios.post(
            `${api.defaults.baseURL}/api/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const newAccessToken = refreshResponse.data.access;

          // Store the new access token in localStorage
          localStorage.setItem("access_token", newAccessToken);

          // Update the Authorization header for the original failed request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request with the new token
          return api(originalRequest);
        } else {
          // No refresh token available, or refresh failed
          // console.error("No refresh token available. Redirecting to login.");
          // Clear any potentially invalid tokens
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Redirect to the login page
          window.location.href = "/login";
        }
      } catch (refreshError) {
        // console.error("Failed to refresh token:", refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Redirect to the login page
        window.location.href = "/login";
      }
    }

    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api;
