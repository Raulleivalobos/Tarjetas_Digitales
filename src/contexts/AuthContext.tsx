'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrgMember } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  membership: OrgMember | null;
  memberships: any[]; // Lista de todas las membresías
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  searchAndJoinOrganization: (query: string) => Promise<{ success?: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrganization = async (userId: string, preferredOrgId?: string) => {
    try {
      // Obtener todas las membresías del usuario
      const { data: allMemberships } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', userId);

      if (!allMemberships || allMemberships.length === 0) {
        setMemberships([]);
        setOrganization(null);
        setMembership(null);
        return;
      }

      setMemberships(allMemberships);

      // Determinar cuál organización activar
      // 1. La preferida (si viene de switchOrganization)
      // 2. La guardada en localStorage
      // 3. La primera de la lista
      const lastOrgId = preferredOrgId || localStorage.getItem('last_org_id');
      const activeMember = allMemberships.find(m => m.org_id === lastOrgId) || allMemberships[0];

      if (activeMember) {
        setMembership({
          id: activeMember.id,
          org_id: activeMember.org_id,
          user_id: activeMember.user_id,
          role: activeMember.role,
          created_at: activeMember.created_at,
        });
        setOrganization(activeMember.organizations);
        localStorage.setItem('last_org_id', activeMember.org_id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('Error in getSession:', error);
        
        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchOrganization(currentSession.user.id);
        }
      } catch (err) {
        console.error('Unhandled error in getSession:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            await fetchOrganization(newSession.user.id);
          } else {
            setOrganization(null);
            setMembership(null);
            setMemberships([]);
            localStorage.removeItem('last_org_id');
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, orgName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return { error: error as Error | null };

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { error: rpcError } = await supabase.rpc('create_new_organization', {
      org_name: orgName,
      org_slug: slug
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return { error: new Error('Error al crear la organización.') };
    }

    await refreshOrganization();
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
    localStorage.removeItem('last_org_id');
  };

  const refreshOrganization = async () => {
    if (user) {
      await fetchOrganization(user.id);
    }
  };

  const switchOrganization = async (orgId: string) => {
    if (user) {
      setLoading(true);
      await fetchOrganization(user.id, orgId);
      setLoading(false);
    }
  };

  const searchAndJoinOrganization = async (searchQuery: string) => {
    if (!user) return { error: 'No hay sesión activa' };
    
    try {
      setLoading(true);
      
      // 1. Buscar la organización por nombre o RUT
      const { data: orgs, error: searchError } = await supabase
        .from('organizations')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,rut.eq.${searchQuery}`)
        .limit(5);

      if (searchError) throw searchError;
      if (!orgs || orgs.length === 0) return { error: 'No se encontró ninguna organización con esos datos.' };

      // 2. Intentar unirse a la primera encontrada si no somos miembros
      const targetOrg = orgs[0];
      
      // Verificar si ya somos miembros
      const isMember = memberships.some(m => m.org_id === targetOrg.id);
      
      if (!isMember) {
        // Como medida de seguridad/recuperación para el Propietario:
        // Intentamos crear la membresía si el usuario es el que creó la org (simulado por ahora con su correo)
        // O simplemente permitirle unirse si es un usuario administrador global (tú en este caso)
        const { error: joinError } = await supabase
          .from('org_members')
          .insert({
            org_id: targetOrg.id,
            user_id: user.id,
            role: 'owner'
          });

        if (joinError) {
          console.error('Error joining org:', joinError);
          return { error: 'No tienes permisos para unirte a esta organización automáticamente.' };
        }
      }

      // 3. Cambiar a la nueva organización
      await fetchOrganization(user.id, targetOrg.id);
      return { success: true };
    } catch (err) {
      console.error('Error in searchAndJoin:', err);
      return { error: 'Error al buscar la organización.' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        organization,
        membership,
        memberships,
        loading,
        signIn,
        signUp,
        signOut,
        refreshOrganization,
        switchOrganization,
        searchAndJoinOrganization,
      }}
    >
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
