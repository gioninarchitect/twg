/**
 * Tea With God - API Service
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Detect environment from hostname
const getApiUrl = () => {
  if (typeof window === 'undefined') return 'https://teawithgod.com/api/v1';
  const hostname = window.location.hostname;
  if (hostname === 'localhost') return 'http://localhost:3000/api/v1';
  if (hostname.includes('twg.cleva-ai.co.za')) return 'https://twg.cleva-ai.co.za/api/v1';
  return 'https://teawithgod.com/api/v1'; // Production
};
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Platform-aware token retrieval
async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('authToken');
  }
  return SecureStore.getItemAsync('authToken');
}

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
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

// Access Code Validation (server-side)
export interface AccessValidationResponse {
  valid: boolean;
  accessLevel?: 'FULL';
  plan?: string;
  codeType?: 'owner' | 'organization' | 'purchase';
  firstName?: string;
  error?: string;
}

export const accessApi = {
  validateCode: async (code: string): Promise<AccessValidationResponse> => {
    try {
      const response = await api.post('/access/validate', { code });
      return response.data;
    } catch (error: any) {
      // Handle rate limiting
      if (error.response?.status === 429) {
        return { valid: false, error: 'Too many attempts. Try again later.' };
      }
      // Handle network errors gracefully
      if (!error.response) {
        return { valid: false, error: 'Network error. Please check your connection.' };
      }
      return { valid: false, error: 'Validation failed' };
    }
  },
};

export default api;
