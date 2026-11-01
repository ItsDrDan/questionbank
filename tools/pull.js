// Load a game page in headless Chromium and read variables from it after the page has run.
// usage: node pull.js <gameDir> VAR1 VAR2 ...   -> prints JSON {VAR: value}
const {chromium}=require('playwright');
(async()=>{
  const [dir,...vars]=process.argv.slice(2);
  const b=await chromium.launch();const p=await b.newPage();
  p.on('pageerror',e=>process.stderr.write('pageerror: '+e.message+'\n'));
  await p.route(/^https?:/,r=>r.abort());           // offline: no stats, no fonts
  await p.goto('file://'+dir+'/index.html',{waitUntil:'load'});
  await p.waitForTimeout(500);
  const out={};
  for(const v of vars){ try{ out[v]=await p.evaluate(`JSON.parse(JSON.stringify(${v}))`);}catch(e){ out[v]={__error:e.message.split('\n')[0]}; } }
  console.log(JSON.stringify(out));
  await b.close();
})();
