'use server';

import { createClient } from '@supabase/supabase-js';

export async function logActivity({
  orgId,
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  details
}: {
  orgId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Audit Log missing credentials');
    return { success: false, error: 'Configuración de servidor incompleta' };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        user_email: userEmail,
        action: action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null
      })
      .select();

    if (error) {
      console.error('FAILED TO LOG ACTIVITY:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Audit log exception:', err);
    return { success: false, error: err.message };
  }
}
