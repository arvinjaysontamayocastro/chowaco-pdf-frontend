import axios from 'axios';

const base = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: base,
  timeout: 60_000,
});

export default api;
