const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const B=require('../basic-shade.js');
assert.equal(B.presets.length,7);
assert.equal(B.INNER_MOUNT.toFixed(3),'35.044');
const ctx={window:{addEventListener(){},OpenLampBasics:B},console,Math,
 Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(__dirname+'/../app.js','utf8'),ctx);
const a=ctx.window.OpenLampTest;
assert.equal(a.PRESETS.filter(x=>!x.archived).length,7,'Seven real basic presets only');
assert.equal(a.PRESETS.length,19,'All prior IDs remain for legacy JSON');
for(const p of B.presets){
 for(const mode of ['original','flat','curved']){
  const shade=B.build({...p,surfaceIntensity:1});
  const report=a.validate(shade);
  assert(report.ok,p.id+': '+JSON.stringify(report));
  assert.equal(shade.triangleCount,4*B.SEGMENTS*B.LEVELS);
  // All bottom INNER rim coordinates are unchanged in every silhouette.
  for(let j=0;j<B.SEGMENTS;j++){
   const innerOffset=B.LEVELS*B.SEGMENTS*3+3*j;
   assert(Math.abs(Math.hypot(shade.positions[innerOffset],shade.positions[innerOffset+1])-B.INNER_MOUNT)<.00001,p.id+' inner mount');
  }
  const p2={...p,topMode:mode};
  const cap=mode==='original'?null:a.buildTopCap(shade,p2.topMode);
  if(cap)assert(a.validate(cap).ok,'Invalid cap '+p.id+' '+mode);
  assert.equal(a.stlBinary(shade).byteLength,84+50*shade.triangleCount);
 }
 for(const intensity of [.91,1.05]){
  const ribbed=B.build({...p,surfaceIntensity:intensity});
  assert(a.validate(ribbed).ok,p.id+' surface '+intensity);
 }
 const changed=B.build({...p,height:p.height+8,diameter:p.diameter+8});
 assert(a.validate(changed).ok,p.id+' changed geometry');
}
let cone=B.presets.find(p=>p.id==='basic_cone');
assert.equal(B.optionsFor({...cone,basicOptions:{topDiameter:98}}).topDiameter,98);
assert(!B.validateParams({...cone,thickness:0.5}).ok);
console.log('PASS 7 shapes x top modes, surface variants, dimensions, open shells, fixed mating ring, legacy IDs');