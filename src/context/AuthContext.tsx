import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'recruiter' | 'hiring_manager';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarInitials: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  recruiter: 'Recruiter RRHH',
  hiring_manager: 'Hiring Manager',
};

export const DEMO_PROFILES: Record<'recruiter' | 'hiring_manager' | 'admin', UserProfile> = {
  recruiter: {
    id: 'usr-recruiter-1',
    name: 'Sofía Seal',
    email: 'sofia.seal@hireflow.app',
    role: 'recruiter',
    department: 'Recursos Humanos & Selección',
    avatarInitials: 'SS',
  },
  hiring_manager: {
    id: 'usr-manager-1',
    name: 'Lucas Gómez',
    email: 'lucas.gomez@hireflow.app',
    role: 'hiring_manager',
    department: 'Hiring Manager · Tecnología & Comercial',
    avatarInitials: 'LG',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Administrador',
    email: 'admin@hireflow.app',
    role: 'admin',
    department: 'Head of Talent & Dirección',
    avatarInitials: 'AD',
  },
};

const STORAGE_KEY = 'hireflow_auth_user';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (profileKey: 'recruiter' | 'hiring_manager' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Por defecto iniciamos con el perfil de recruiter para mantener la experiencia fluida si ya navega
    return DEMO_PROFILES.recruiter;
  });

  const [loading, setLoading] = useState(false);
  const isSupabaseActive = isSupabaseConfigured;

  // Escuchar sesión de Supabase si está activo
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'usuario@hireflow.app',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          role: session.user.user_metadata?.role || 'recruiter',
          department: session.user.user_metadata?.department || 'Talento',
          avatarInitials: (session.user.user_metadata?.full_name?.[0] || session.user.email?.[0] || 'U').toUpperCase(),
        };
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'usuario@hireflow.app',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          role: session.user.user_metadata?.role || 'recruiter',
          department: session.user.user_metadata?.department || 'Talento',
          avatarInitials: (session.user.user_metadata?.full_name?.[0] || session.user.email?.[0] || 'U').toUpperCase(),
        };
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Si Supabase está conectado, intentar autenticación real
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'recruiter',
            department: data.user.user_metadata?.department || 'Talento & RRHH',
            avatarInitials: (data.user.user_metadata?.full_name?.[0] || email[0] || 'U').toUpperCase(),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error de conexión con Supabase' };
      }
    }

    // Modo local / demo: mapear o crear perfil dinámico
    const foundDemo = Object.values(DEMO_PROFILES).find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );

    const activeProfile: UserProfile = foundDemo || {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role: 'recruiter',
      department: 'Recursos Humanos',
      avatarInitials: (email[0] || 'U').toUpperCase(),
    };

    setUser(activeProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProfile));
    setLoading(false);
    return { success: true };
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole = 'recruiter'
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
              role,
              department: role === 'hiring_manager' ? 'Operaciones / Tech' : 'Recursos Humanos',
            },
          },
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || data.user.user_metadata?.full_name || email.split('@')[0],
            role,
            department: role === 'hiring_manager' ? 'Operaciones / Tech' : 'Recursos Humanos',
            avatarInitials: ((name || email)[0] || 'U').toUpperCase(),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error al registrar en Supabase' };
      }
    }

    // Modo local / demo fallback
    const localUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      name: name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role,
      department: role === 'hiring_manager' ? 'Tecnología & Comercial' : 'Recursos Humanos & Selección',
      avatarInitials: ((name || email)[0] || 'U').toUpperCase(),
    };

    setUser(localUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
    setLoading(false);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error de autenticación con Google' };
      }
    }

    // Modo demo fallback para Google Workspace
    const googleProfile: UserProfile = {
      id: `usr-google-${Date.now()}`,
      name: 'Usuario Google Workspace',
      email: 'recruiter.google@hireflow.app',
      role: 'recruiter',
      department: 'Recursos Humanos',
      avatarInitials: 'GW',
    };

    setUser(googleProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(googleProfile));
    setLoading(false);
    return { success: true };
  };

  const resetPassword = async (emailToReset: string): Promise<{ success: boolean; error?: string }> => {
    if (!emailToReset.trim()) {
      return { success: false, error: 'Por favor, ingresá un correo válido.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // En modo local demo siempre retorna éxito simulado
    return { success: true };
  };

  const loginAsDemo = (profileKey: 'recruiter' | 'hiring_manager' | 'admin') => {
    const profile = DEMO_PROFILES[profileKey];
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseActive,
        login,
        signUp,
        loginWithGoogle,
        resetPassword,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
