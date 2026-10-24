const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),D=require('../shade-design.js');
const ctx={window:{addEventListener(){},OpenLampShade:D},console,Math,
 Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx);
const api=ctx.window.OpenLampTest;
const buffers=[];
for(let i=0;i<19;i++)buffers.push(fs.readFileSync(path.join(root,'assets','shades',
 'tallertop-original.olmesh.gz.part-'+String(i).padStart(2,'0'))));
const raw=zlib.gunzipSync(Buffer.concat(buffers));
const ab=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const source=api.parseStandMesh(ab);
const master=api.PRESETS.find(p=>p.id==='tallertop_original');
assert.equal(source.triangleCount,684792);
for(const family of ['original','vertical','soft','flared']){
 const design=D.preset(family),f=D.families[family];
 const preset={...master,shadeDesign:design,
   height:family==='original'?master.height:(f.height[0]+f.height[1])/2,
   diameter:family==='original'?master.diameter:(f.diameter[0]+f.diameter[1])/2};
 const result=api.deformOriginalShade(source,preset),report=api.validateOriginalDeformation(source,result);
 assert(report.ok,family+' geometry invalid '+JSON.stringify(report));
 assert.equal(result.triangleCount,source.triangleCount);
 assert.strictEqual(result.indices,source.indices);
 for(let i=0;i<source.positions.length;i+=3){
  if(source.positions[i+2]>api.DEFORMATION_LOCK_END)continue;
  for(let k=0;k<3;k++)assert.equal(result.positions[i+k],source.positions[i+k]);
 }
 if(family==='original')assert.strictEqual(result,source,'Unchanged master must remain same mesh');
 else assert.notStrictEqual(result,source,'Family must be a changed mesh');
 console.log('PASS Shade OBJ',family,'faces',result.triangleCount,'volume',report.volume?.toFixed(2));
}
console.log('PASS unchanged mount, original mesh identity and three parametric families');