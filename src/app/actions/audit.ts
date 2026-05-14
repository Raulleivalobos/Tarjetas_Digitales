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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
      throw new Error(`Audit Log Error: ${error.message}`);
    }
    
    console.log('Successfully logged activity:', action);
    return { success: true, data };
  } catch (err) {
    console.error('Audit log exception:', err);
    return { success: false, error: err };
  }
}
