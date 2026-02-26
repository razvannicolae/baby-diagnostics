import { createContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { AuthContextType, User } from '../types/auth';
import { loginWithGoogle, devLogin as apiDevLogin, getMe, setToken } from '../services/api';

export const AuthContext = createContext<AuthContextType | null>(null);

const isDev = import.meta.env.VITE_APP_ENV === 'development';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    // On mount, check if we have a stored session (dev only)
    if (isDev) {
      const devToken = sessionStorage.getItem('dev_token');
      if (devToken) {
        tokenRef.current = devToken;
        setToken(devToken);
        getMe()
          .then(setUser)
          .catch(() => {
            sessionStorage.removeItem('dev_token');
            tokenRef.current = null;
            setToken(null);
          })
          .finally(() => setIsLoading(false));
        return;
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      const response = await loginWithGoogle(credential);
      tokenRef.current = response.access_token;
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const devLogin = useCallback(async () => {
    if (!isDev) return;
    setIsLoading(true);
    try {
      const response = await apiDevLogin();
      tokenRef.current = response.access_token;
      setToken(response.access_token);
      sessionStorage.setItem('dev_token', response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('dev_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, token: tokenRef.current, login, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}
