import React, { createContext, useContext, useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular un pequeño delay para la carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const value: AuthContextType = {
    isAuthenticated: !!account,
    user: account,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 