import { createContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from './supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  const value = {
    session,
    isLoading,
    isAuthenticated: !!session,
    user: session?.user || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
