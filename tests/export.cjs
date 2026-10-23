const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={window:{addEventListener:()=>{}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),ctx,{filename:'app.js'});
const o=ctx.window.OpenLampTest;
for (const p of o.PRESETS) {
  const design={...p,clearance:o.defaultClearance};
  for (const [part,mesh] of [['pantalla',o.buildShade(design)],['base',o.buildBase(design)]]){
    const quality=o.validate(mesh);
    if(!quality.ok)throw new Error(`Malla invalida ${p.id}/${part}: ${JSON.stringify(quality)}`);
    fs.writeFileSync(path.join(__dirname,'../examples',`${p.id}-${part}.stl`),Buffer.from(o.stlBinary(mesh)));
  }
}