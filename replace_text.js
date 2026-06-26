const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/app/(public)/como-funciona/page.tsx',
  'src/app/(public)/page.tsx',
  'src/app/(public)/terminos-y-condiciones/page.tsx',
  'src/app/actions/beneficiaries.ts',
  'src/app/dashboard/attendance/[id]/page.tsx',
  'src/app/dashboard/attendance/page.tsx',
  'src/app/dashboard/beneficiaries/[id]/edit/page.tsx',
  'src/app/dashboard/beneficiaries/[id]/page.tsx',
  'src/app/dashboard/beneficiaries/new/page.tsx',
  'src/app/dashboard/beneficiaries/page.tsx',
  'src/app/dashboard/benefits/[id]/page.tsx',
  'src/app/dashboard/benefits/check-columns.ts',
  'src/app/dashboard/benefits/deliver/page.tsx',
  'src/app/dashboard/benefits/page.tsx',
  'src/app/dashboard/cards/page.tsx',
  'src/app/dashboard/certificates/[id]/page.tsx',
  'src/app/dashboard/certificates/issue/page.tsx',
  'src/app/dashboard/certificates/page.tsx',
  'src/app/dashboard/issue/page.tsx',
  'src/app/dashboard/municipal/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/scanner/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/test-qr/page.tsx',
  'src/app/validate/[slug]/[id]/page.tsx',
  'src/app/validate/cert/[id]/page.tsx',
  'src/components/layout/DashboardLayout.tsx',
  'src/components/municipal/ManagementAlerts.tsx',
  'src/components/municipal/TerritorialMap.tsx'
];

const replacements = [
  { regex: /No hay beneficiarios/gi, replace: 'No hay socios' },
  { regex: /crear beneficiarios/gi, replace: 'crear socios' },
  { regex: /tus beneficiarios/gi, replace: 'tus socios' },
  { regex: /Distribución de beneficiarios/gi, replace: 'Distribución de socios' },
  { regex: /gestionar beneficiarios/gi, replace: 'gestionar socios' },
  { regex: /Credencial de Beneficiario/gi, replace: 'Credencial de Socio' }
];

let totalChanges = 0;

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replace);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', file);
      totalChanges++;
    }
  }
});

console.log('Total files updated (pass 2):', totalChanges);
