// Pull a top-level array/object literal out of a game's index.html and evaluate it.
// usage: grab(htmlPath, varName) -> value
const fs=require('fs'),vm=require('vm');
function literalAt(src,i){ // i = index of first [ or {
  const open=src[i],close=open==='['?']':'}';let d=0,q=null,esc=false;
  for(let j=i;j<src.length;j++){const c=src[j];
    if(q){ if(esc){esc=false;continue;} if(c==='\\'){esc=true;continue;} if(c===q)q=null; else if(q==='`'&&c==='$'&&src[j+1]==='{'){} continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='/'&&src[j+1]==='/'){j=src.indexOf('\n',j);continue;}
    if(c==='/'&&src[j+1]==='*'){j=src.indexOf('*/',j)+1;continue;}
    if(c==='['||c==='{')d++; else if(c===']'||c==='}'){d--; if(d===0)return src.slice(i,j+1);} }
  throw new Error('unbalanced');
}
function grab(file,name,ctx={}){
  const src=fs.readFileSync(file,'utf8');
  const re=new RegExp('(?:const|let|var)\\s+'+name.replace(/[.$]/g,'\\$&')+'\\s*=\\s*');
  const m=re.exec(src); if(!m) throw new Error(name+' not found in '+file);
  let i=m.index+m[0].length; while(src[i]!=='['&&src[i]!=='{'){ if(!/\s/.test(src[i])) throw new Error(name+' is not a literal'); i++; }
  const lit=literalAt(src,i);
  return vm.runInNewContext('('+lit+')',Object.assign({Math},ctx));
}
module.exports={grab,literalAt};
