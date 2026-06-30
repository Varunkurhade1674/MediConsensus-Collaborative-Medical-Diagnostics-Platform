import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token, user) => {
    localStorage.setItem('mediconsensus_token', token);
    localStorage.setItem('mediconsensus_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('mediconsensus_token');
    localStorage.removeItem('mediconsensus_user');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('mediconsensus_token');
    const userJson = localStorage.getItem('mediconsensus_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } catch (e) {
        localStorage.removeItem('mediconsensus_token');
        localStorage.removeItem('mediconsensus_user');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));
