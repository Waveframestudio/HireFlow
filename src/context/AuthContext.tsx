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
    name: 'Sofía Lilén Seal',
    email: 'sofia.seal@hireflow.app',
    role: 'recruiter',
    department: 'Recursos Humanos',
    avatarInitials: 'SS',
  },
  hiring_manager: {
    id: 'usr-manager-1',
    name: 'Lucas Pereyra',
    email: 'lucas.pereyra@hireflow.app',
    role: 'hiring_manager',
    department: 'Comercial & Producto',
    avatarInitials: 'LP',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Equipo HireFlow',
    email: 'admin@hireflow.app',
    role: 'admin',
    department: 'Head of Talent',
    avatarInitials: 'HF',
  },
};

const STORAGE_KEY = 'hireflow_auth_user';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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

  // Escuchar sesión de Supabase si está activo
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'usuario@hireflow.app',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          role: 'recruiter',
          department: 'Talento',
          avatarInitials: (session.user.email?.[0] || 'U').toUpperCase(),
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
          role: 'recruiter',
          department: 'Talento',
          avatarInitials: (session.user.email?.[0] || 'U').toUpperCase(),
        };
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        // no forzar logout inmediato si usa demo local
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
            role: 'recruiter',
            department: 'Talento & RRHH',
            avatarInitials: (email[0] || 'U').toUpperCase(),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error de conexión' };
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
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, logout }}>
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
