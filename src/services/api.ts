// src/services/api.ts  (Production-safe)
import axios from 'axios';

const base = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: base, // e.g. https://chowacopdfbackend.netlify.app/api
  // no JSON content-type here; set per request (JSON vs multipart)
  timeout: 60_000,
});

export default api;
