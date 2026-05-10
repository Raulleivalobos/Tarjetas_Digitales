const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const orgId = 'ad77b869-3b0f-4bf6-8a59-cfce3dc95a1c';
  console.log("Starting 9 queries...");
  try {
    const start = Date.now();
    const res = await Promise.all([
      supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
      supabase.from('digital_cards').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active'),
      supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'used'),
      supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'pending'),
      supabase.from('validation_logs').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
      supabase.from('beneficiaries').select('id, full_name, rut, status, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
      supabase.from('certificates').select('*, beneficiaries(full_name)').eq('org_id', orgId).order('issued_at', { ascending: false }).limit(3),
    ]);
    console.log("Finished in", Date.now() - start, "ms");
    res.forEach((r, i) => console.log(`Query ${i}: error = ${r.error?.message || null}`));
  } catch(e) {
    console.error("Promise.all threw:", e);
  }
}
check();
