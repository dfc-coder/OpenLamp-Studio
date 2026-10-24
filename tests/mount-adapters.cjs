const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const M=require('../mount-adapters.js'),B=require('../basic-shade.js');
const context={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context);
const a=context.window.OpenLampTest;
const bytes=fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz'));
const raw=zlib.gunzipSync(bytes);
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const stand=a.parseStandMesh(buffer);
assert.equal(a.validate(stand).ok,true,'Wibble source must be valid');
const immutableSourceCopy=Buffer.from(stand.positions.buffer,stand.positions.byteOffset,stand.positions.byteLength).subarray(0).toString('base64');
const direct=M.mountFor('flat',stand);
assert(!direct.adapter);assert.equal(direct.interface.kind,'direct');
assert(Math.abs(direct.shadeBottom-(35.59607-14.17))<1e-6);
const integrated=M.mountFor('wibble',stand);
assert(integrated.adapter,'Wibble MUST generate an adapter, not reuse Taller cylindrical seat');
assert.equal(integrated.contactSites,4);
assert.equal(integrated.interface.kind,'conformal-bridge');
assert(integrated.shadeBottom>200&&integrated.shadeBottom<213);
assert.notEqual(integrated.shadeBottom,direct.shadeBottom);
const check=a.validate(integrated.adapter);
assert(check.ok,'Wibble bridge must be a closed orientable manifold: '+JSON.stringify(check));
assert.equal(integrated.adapter.triangleCount,integrated.adapter.indices.length/3);
assert.equal(Buffer.from(stand.positions.buffer,stand.positions.byteOffset,stand.positions.byteLength).toString('base64'),
  immutableSourceCopy,'Wibble OBJ vertices must not be modified');
assert(integrated.bridgeProfile.seatTop-integrated.shadeBottom>13.5 &&
       integrated.bridgeProfile.seatTop-integrated.shadeBottom<14.17,
  'Shade has to overlap the Wibble adapter male seat with nominal insertion');
const upperSampler=M.upperSurfaceSampler(stand,integrated.bridgeProfile.top-26);
let reliefSamples=0;
const adapter=integrated.adapter;
const countAround=128;
const rings=adapter.positions.length/(3*countAround);
const firstUndersideRing=23;
for(let k=firstUndersideRing;k<rings;k++)for(let j=0;j<countAround;j++){
  const i=3*(k*countAround+j),x=adapter.positions[i],y=adapter.positions[i+1],z=adapter.positions[i+2];
  const contactZ=upperSampler(x,y);
  if(!Number.isFinite(contactZ))continue;
  assert(z+0.002>=contactZ+integrated.interface.contactClearance,
    'Bridge underside must remain CAD-clear of the Wibble mesh');
  reliefSamples++;
}
assert(reliefSamples>100,'Must check real source-derived contact samples, not just four tips');

const file=a.stlBinary(integrated.adapter);
assert.equal(file.byteLength,84+integrated.adapter.triangleCount*50);
assert.strictEqual(M.mountFor('wibble',stand).adapter,integrated.adapter,'identical source must reuse bridge');
const upper=M.topLobes(stand);
assert.equal(upper.tips.length,4);
for(const tip of upper.tips)assert(upper.zTop-tip.z<1.5);
const sampled=M.upperSurfaceSampler(stand,upper.zTop-26);
let contacts=0;
for(const tip of upper.tips){
 const z=sampled(tip.x,tip.y);
 assert(Number.isFinite(z)&&upper.zTop-z<1.5,'Each of the four tips needs a sampled CAD surface');
 contacts++;
}
for(const name of B.presets.map(p=>p.id)){
 const preset=B.presets.find(p=>p.id===name);
 const shade=B.build(preset);
 assert(a.validate(shade).ok);
 const low=shade.positions[2];
 assert.equal(low,0);
 // Universal shade/adapter male and female radii are intentionally different,
 // producing the original clearance without changing shade STL when switching bases.
 assert(Math.abs(B.INNER_MOUNT-integrated.interface.seatOuterRadius-0.164)<1e-6);
}
assert.equal(integrated.status,'prototype');
console.log('PASS dynamic mounts: Taller direct + Wibble 4-apex conformal bridge, manifold STL, cached, 7 shade bodies; physical retention unverified');
