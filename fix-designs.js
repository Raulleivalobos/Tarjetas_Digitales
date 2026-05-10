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

async function fix() {
  const { data, error } = await supabase
    .from('card_designs')
    .update({ design_type: 'certificate' })
    .or('name.ilike.%certificado%,name.ilike.%residencia%')
    .eq('design_type', 'card')
    .select();
  
  if (error) console.error('Error:', error);
  else console.log('Fixed designs:', data.map(d => d.name));
}
fix();
