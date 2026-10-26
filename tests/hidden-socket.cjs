const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const ctx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),ctx);
const g=ctx.window.OpenLampTest;
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const stand=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length));
const mounts={flat:M.mountFor('flat',stand),wibble:M.mountFor('wibble',stand)};
let feasible=0,blocked=0;
for(const original of B.presets){
 const old=B.build(original,mounts.flat);
 assert(g.validate(old).ok);
 assert(Math.abs(Math.hypot(old.positions[0],old.positions[1])-B.radiusAt(0,original))<.01,
   'Taller legacy silhouette modified');
 const fit=B.fitForMount(original,mounts.wibble);
 if(!fit.ok){
   blocked++;
   assert(fit.minimum>220);
   assert.throws(()=>B.build(original,mounts.wibble),/Diámetro insuficiente/);
   continue;
 }
 feasible++;
 const p=fit.params,shade=B.build(p,mounts.wibble);
 assert(g.validate(shade).ok,p.id+' malformed shell');
 assert(!mounts.wibble.adapter);
 const N=192,zAt=(j)=>shade.positions[(j%N)*3+2];
 const seam=Array.from({length:N},(_,j)=>zAt(j));
 assert(Math.max(...seam)-Math.min(...seam)>7,
   p.id+' still has a flat z=0 lower lip');
 for(let j=0;j<N;j++){
   const theta=2*Math.PI*j/N;
   assert(Math.abs(zAt(j)-mounts.wibble.integrated.lipHeight(theta))<0.02,
     p.id+' lower lip fails to follow actual Wibble crown');
   const external=Math.hypot(shade.positions[j*3],shade.positions[j*3+1]);
   assert(Math.abs(external-B.radiusAt(0,p))<.015,
     p.id+' silhouette incorrectly widened into another artificial skirt');
   assert(external>mounts.wibble.integrated.minExteriorRadius);
 }
 assert.equal(B.visualRadiusAt(0,p,mounts.wibble),B.radiusAt(0,p));
 assert.equal(B.visualRadiusAt(1,p,mounts.wibble),B.radiusAt(1,p));
}
assert.equal(feasible,7,'All seven shade families must work with Wibble');
assert.equal(blocked,0,'Sphere and Disc must not be silently disabled');
console.log('PASS shaped lip: no flare, angular lower seam tracks Wibble CAD, Taller remains untouched, undersized forms rejected ('+feasible+' valid, '+blocked+' blocked)');
