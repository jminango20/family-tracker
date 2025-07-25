// lib/useAuth.ts
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  };
};