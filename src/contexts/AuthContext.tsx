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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrganization = async (userId: string) => {
    try {
      // Get user's organization membership
      const { data: memberData } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (memberData) {
        setMembership({
          id: memberData.id,
          org_id: memberData.org_id,
          user_id: memberData.user_id,
          role: memberData.role,
          created_at: memberData.created_at,
        });
        setOrganization((memberData as unknown as { organizations: Organization }).organizations);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  useEffect(() => {
    // Failsafe timeout to prevent infinite loading
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error in getSession:', error);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, orgName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return { error: error as Error | null };

    // Create organization using RPC to bypass RLS race conditions safely
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
      return { error: new Error('Error al crear la organización. Asegúrate de ejecutar la función SQL.') };
    }

    // Actualizar el estado local
    await refreshOrganization();

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrganization(null);
    setMembership(null);
  };

  const refreshOrganization = async () => {
    if (user) {
      await fetchOrganization(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        organization,
        membership,
        loading,
        signIn,
        signUp,
        signOut,
        refreshOrganization,
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
