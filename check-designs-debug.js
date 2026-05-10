const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://idadoqaekgeunztslgfm.supabase.co',
  'sb_publishable_MahDLj1L-NVNLZMFxQJ_Iw_KjKo4eCP'
);

async function main() {
  // 1. Get all orgs
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug');
  
  if (orgErr) {
    console.error('Error fetching orgs:', orgErr.message);
    return;
  }
  
  console.log('=== ORGANIZATIONS ===');
  orgs.forEach(o => console.log(`  ${o.id} | ${o.name} | ${o.slug}`));

  // 2. For each org, get designs
  for (const org of orgs) {
    const { data: designs, error: dErr } = await supabase
      .from('card_designs')
      .select('id, name, design_type, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });

    if (dErr) {
      console.error(`Error fetching designs for ${org.name}:`, dErr.message);
      continue;
    }

    console.log(`\n=== DESIGNS for "${org.name}" (${designs.length} total) ===`);
    designs.forEach(d => {
      console.log(`  ${d.id} | name="${d.name}" | design_type=${d.design_type} | created=${d.created_at}`);
    });

    // Show filter result
    const cardDesigns = designs.filter(d => 
      d.design_type !== 'certificate' && !d.name.toLowerCase().includes('certificado')
    );
    console.log(`  >> After card filter: ${cardDesigns.length} designs`);
    cardDesigns.forEach(d => console.log(`     ✓ ${d.name} (type=${d.design_type})`));

    const certDesigns = designs.filter(d => 
      d.design_type === 'certificate' || d.name.toLowerCase().includes('certificado')
    );
    console.log(`  >> Certificates: ${certDesigns.length} designs`);
    certDesigns.forEach(d => console.log(`     ✗ ${d.name} (type=${d.design_type})`));
  }
}

main().catch(console.error);
