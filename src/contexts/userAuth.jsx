import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../assets/supabase/client';

export const AuthContext = createContext();


export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener la sesión actual de supabase.auth.getSession()
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getSession();
      setUser(user);
      setLoading(false);
    };

    getSession();

    const authListener = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Modificamos el retorno para asegurar que se desuscriba correctamente
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    try {
      const { user, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};