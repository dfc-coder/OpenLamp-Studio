const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const cx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),cx);
const g=cx.window.OpenLampTest;
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const wibble=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const mounts={flat:M.mountFor('flat',wibble),wibble:M.mountFor('wibble',wibble)};
let checked=0;
for(const p of B.presets){
 const flat=B.build(p,mounts.flat),integrated=B.build(p,mounts.wibble);
 assert(g.validate(flat).ok,p.id+' original Taller shade invalid');
 assert(g.validate(integrated).ok,p.id+' integrated Wibble shade invalid');
 assert.notStrictEqual(flat,integrated);
 const flatCross=B.crossSection(p,mounts.flat),wCross=B.crossSection(p,mounts.wibble);
 assert(flatCross.some(x=>x.kind==='plain'&&x.r===B.INNER_MOUNT&&x.z===0));
 assert(!wCross.some(x=>x.kind==='plain'&&x.r===B.INNER_MOUNT&&x.z===0),
   'Wibble cannot reuse Taller male socket');
 assert(wCross.some(x=>x.kind==='plain'&&x.z===mounts.wibble.integrated.contactUndersideZ));
 const outer=(mesh)=>Math.hypot(mesh.positions[0],mesh.positions[1]);
 assert(Math.abs(outer(flat)-B.radiusAt(0,p))<0.001,'Taller exterior must be identical');
 assert(Math.abs(outer(integrated)-B.visualRadiusAt(0,p,mounts.wibble))<0.001);
 assert(outer(integrated)>=mounts.wibble.integrated.requiredExteriorRadius-.002,
   'Wibble skirt must surround four tip radius without the green bridge');
 assert(B.visualRadiusAt(1,p,mounts.wibble)===B.radiusAt(1,p),
   'Ergonomic flare must disappear in the upper original silhouette');
 for(const z of [0,4,8,16]){
  const r=B.visualRadiusAt(z/p.height,p,mounts.wibble);
  assert(r-p.thickness-mounts.wibble.integrated.innerShelfRadius>10,
   'Landing shelf must fit inside printed wall at z='+z);
 }
 // Imported Wibble geometry remains immutable: no collision with the
 // exterior skirt down 3mm and annular underside lies above tip heights.
 for(const tip of M.topLobes(wibble).tips){
  assert(mounts.wibble.shadeBottom+mounts.wibble.integrated.contactUndersideZ-tip.z>0.2);
  assert(outer(integrated)-tip.r>7);
 }
 assert(mounts.flat.adapter===null&&mounts.wibble.adapter===null);
 checked+=2;
}
assert.equal(checked,14);
console.log('PASS 14 dual-base shades: Taller unchanged, Wibble integrated ergonomic skirt + four-tip ring, no third solid');
