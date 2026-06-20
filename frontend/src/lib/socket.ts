import { io } from "socket.io-client";

// In production, the VITE_API_URL might literally be pointing to the backend
// Fallback is relative path, but socket.io handles relative automatically
// if running on same domain, or we can fallback to window.location.origin
const URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

export const socket = io(URL, {
  autoConnect: false, // We will connect manually when authenticated if we choose
});
