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
  const { data, error } = await supabase.from('card_designs').select('name, elements').ilike('name', '%Certificado%');
  data.forEach(d => {
    if (d.elements) {
      d.elements.forEach(e => {
        if (e.type === 'image') console.log('Design:', d.name, 'Image src:', e.data.src.substring(0, 100));
      });
    }
  });
}
check();
