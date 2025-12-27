/**
 * Tea With God - API Service
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__ ? 'http://localhost:3000/api/v1' : 'https://twg.cleva-ai.co.za/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Auth
export const authApi = {
  register: (email: string, password: string, displayName?: string) =>
    api.post('/auth/register', { email, password, displayName }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () => api.get('/auth/me'),
  
  redeemCode: (code: string) =>
    api.post('/auth/redeem-code', { code }),
};

// Content
export const contentApi = {
  getPhases: () => api.get('/content/phases'),
  getAllDays: () => api.get('/content/days'),
  getDay: (dayNumber: number) => api.get('/content/days/' + dayNumber),
};

// Journey
export const journeyApi = {
  getProgress: () => api.get('/journey/progress'),
  getDayProgress: (dayNumber: number) => api.get('/journey/days/' + dayNumber),
  updateDayProgress: (dayNumber: number, data: any) =>
    api.patch('/journey/days/' + dayNumber, data),
  completeDay: (dayNumber: number) =>
    api.post('/journey/days/' + dayNumber + '/complete'),
};

// Journal
export const journalApi = {
  getEntries: () => api.get('/journal/entries'),
  saveEntry: (dayNumber: number, content: string) =>
    api.post('/journal/entries', { dayNumber, content }),
};

// Crisis (anonymous)
export const crisisApi = {
  log: (sessionHash: string, accessType: string, detectedPhrases?: string[]) =>
    api.post('/crisis/log', { sessionHash, accessType, detectedPhrases }),
};

export default api;
