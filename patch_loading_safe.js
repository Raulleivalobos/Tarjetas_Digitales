const fs = require('fs');

function wrapWithTryCatch(filePath, functionName) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find "async function loadData() {"
  const sigIndex = content.indexOf(`async function ${functionName}() {`);
  if (sigIndex === -1) return false;
  
  // Find setLoading(true); after the signature
  const setLoadingTrueIndex = content.indexOf('setLoading(true);', sigIndex);
  if (setLoadingTrueIndex === -1) return false;
  
  // Find setLoading(false); after setLoadingTrue
  const setLoadingFalseIndex = content.indexOf('setLoading(false);', setLoadingTrueIndex);
  if (setLoadingFalseIndex === -1) return false;
  
  const endOfSetLoadingTrue = content.indexOf('\n', setLoadingTrueIndex) + 1;
  const startOfSetLoadingFalse = content.lastIndexOf('\n', setLoadingFalseIndex) + 1;
  
  const beforeBlock = content.slice(0, endOfSetLoadingTrue);
  const blockToWrap = content.slice(endOfSetLoadingTrue, startOfSetLoadingFalse);
  // Find the end of the block (the closing brace of the function)
  const afterBlock = content.slice(content.indexOf('\n', setLoadingFalseIndex + 18));
  
  let newBlock = `    try {\n`;
  blockToWrap.split('\n').forEach(line => {
    if (line) newBlock += `  ${line}\n`;
  });
  newBlock += `    } catch (e) {\n      console.error(e);\n    } finally {\n      setLoading(false);\n    }\n`;
  
  fs.writeFileSync(filePath, beforeBlock + newBlock + afterBlock);
  console.log(`Patched ${filePath}`);
  return true;
}

wrapWithTryCatch('src/app/dashboard/benefits/page.tsx', 'loadData');
wrapWithTryCatch('src/app/dashboard/attendance/page.tsx', 'loadData');
wrapWithTryCatch('src/app/dashboard/attendance/[id]/page.tsx', 'loadData');
wrapWithTryCatch('src/app/dashboard/benefits/[id]/page.tsx', 'loadDetail');
