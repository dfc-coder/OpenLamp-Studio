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
  let maxRadius=0;
  for(let i=0;i<shade.positions.length;i+=3)
    maxRadius=Math.max(maxRadius,Math.hypot(shade.positions[i],shade.positions[i+1]));
  assert(Math.abs(2*maxRadius-p.diameter)<1.2,
    p.id+' displayed/actual width mismatch '+(2*maxRadius).toFixed(2)+' vs '+p.diameter);
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
// Design identities must be distinguishable even with identical dimensions.
// Preset cards use exactly this same lathed radial profile.
const common={height:170,diameter:160,thickness:1.8};
const silhouettes=B.presets.map(p=>{
 const same={...p,...common,basicOptions:{...p.basicOptions,
   ...(p.id==='basic_cone'||p.id==='basic_bell'?{topDiameter:105}:{})}};
 const samples=Array.from({length:65},(_,i)=>B.radiusAt((i+10)/80,same)/(common.diameter/2));
 return {id:p.id,samples};
});
for(let i=0;i<silhouettes.length;i++)for(let j=i+1;j<silhouettes.length;j++){
 const left=silhouettes[i],right=silhouettes[j];
 const distance=left.samples.reduce((sum,r,k)=>sum+Math.abs(r-right.samples[k]),0)/left.samples.length;
 assert(distance>0.030,
   'Redundant profiles: '+left.id+' / '+right.id+' (radial signature distance '+distance.toFixed(4)+')');
}
const sphere={...B.presets.find(p=>p.id==='basic_sphere'),...common};
const pear={...B.presets.find(p=>p.id==='basic_pear'),...common};
const sphereLow=B.radiusAt(.25,sphere),sphereHigh=B.radiusAt(.75,sphere);
const pearLow=B.radiusAt(.25,pear),pearHigh=B.radiusAt(.75,pear);
assert(Math.abs(sphereLow-sphereHigh)<0.01,'Sphere must remain symmetric above fixed collar');
assert(pearLow-pearHigh>common.diameter*.12,'Pear must have a pronounced low belly and narrow neck');
assert(B.radiusAt(.34,pear)>B.radiusAt(.55,pear),'Pear peak must lie below midheight');
const disc={...B.presets.find(p=>p.id==='basic_disc'),...common};
assert(B.radiusAt(.72,disc)>B.radiusAt(.22,disc)*1.8,
 'Disc must have a wide upper plate, not a second Sphere');
const bell={...B.presets.find(p=>p.id==='basic_bell'),...common,
 basicOptions:{topDiameter:105}};
const conical={...B.presets.find(p=>p.id==='basic_cone'),...common,
 basicOptions:{topDiameter:105}};
assert(B.radiusAt(.48,conical)-B.radiusAt(.48,bell)>common.diameter*.025,
 'Bell requires a stronger flared lip than Cone');
console.log('PASS morphology: pairwise shape signatures, symmetric Sphere, lower Pear belly, upper Disc shelf and Bell flare');

let cone=B.presets.find(p=>p.id==='basic_cone');
assert.equal(B.optionsFor({...cone,basicOptions:{topDiameter:98}}).topDiameter,98);
assert(!B.validateParams({...cone,thickness:0.5}).ok);
console.log('PASS 7 shapes x top modes, surface variants, dimensions, open shells, fixed mating ring, legacy IDs');