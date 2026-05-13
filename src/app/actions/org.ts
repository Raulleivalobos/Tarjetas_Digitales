'use server';

import { createClient } from '@supabase/supabase-js';

export async function getOrgMembers(orgId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Obtener los miembros de la organización
    const { data: members, error: membersError } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId);

    if (membersError) throw membersError;

    // 2. Obtener los emails de Auth (con privilegios de admin)
    // Para no hacer mil llamadas, traemos la lista reciente
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });

    if (authError) throw authError;

    // 3. Enriquecer los miembros con sus emails reales
    const enrichedMembers = members.map(member => {
      const authUser = authData.users.find(u => u.id === member.user_id);
      return {
        ...member,
        email: authUser?.email || `usuario-${member.user_id.substring(0, 4)}@ejemplo.com`
      };
    });

    return { success: true, data: enrichedMembers };
  } catch (error: any) {
    console.error('Error fetching enriched members:', error);
    return { success: false, error: error.message };
  }
}
