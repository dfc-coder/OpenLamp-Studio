const assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),vm=require('node:vm'),path=require('node:path');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const ctx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),ctx);
const api=ctx.window.OpenLampTest;
const compressed=fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz'));
const buf=zlib.gunzipSync(compressed);const mesh=api.parseStandMesh(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length));
assert(api.validate(mesh).ok);
const original=Buffer.from(mesh.positions.buffer,mesh.positions.byteOffset,mesh.positions.byteLength).toString('base64');
const taller=M.mountFor('flat',mesh),wibble=M.mountFor('wibble',mesh);
assert.equal(taller.interface.kind,'direct');
assert.equal(wibble.interface.kind,'integrated-saddle');
assert(!taller.adapter&&!wibble.adapter);
assert.equal(wibble.contactSites,4);
assert(M.topLobes(mesh).tips.length===4);
assert.strictEqual(M.mountFor('wibble',mesh),wibble);
const seat=wibble.integrated;
assert.equal(typeof seat.lipHeight,'function');
assert.equal(typeof seat.sampleTop,'function');
assert(seat.maxTipRadius>70&&seat.maxTipRadius<80);
assert(seat.minExteriorRadius>seat.maxTipRadius+2);
const crownZ=[];
for(let k=0;k<192;k++)crownZ.push(seat.lipHeight(2*Math.PI*k/192));
assert(Math.max(...crownZ)-Math.min(...crownZ)>8,
  'Wibble must have a genuinely nonplanar top-seam');
const source=M.topLobes(mesh),top=M.upperSurfaceSampler(mesh,source.zTop-26);
 // Measure the true outer envelope, not the four upper tip radii alone.
 let upperRadialMaximum=0;
 for(let i=0;i<mesh.positions.length;i+=3){
   if(mesh.positions[i+2]<source.zTop-42)continue;
   upperRadialMaximum=Math.max(upperRadialMaximum,
     Math.hypot(mesh.positions[i],mesh.positions[i+1]));
 }
 assert(seat.minExteriorRadius>=upperRadialMaximum+0.89,
   'The shade wall must be kept outboard of Wibble upper-side surfaces');
 // Regress the visible windows in the gaps between lobes. With the old
 // crown-only sampler these eight valley positions were ~11.6 mm high.
 for(const degrees of [15,30,105,120,195,210,285,300]){
   const valley=seat.lipHeight(degrees*Math.PI/180);
   assert(valley<7.5,'Uncovered Wibble valley at '+degrees+' degrees: '+valley+' mm');
 }

for(const tip of source.tips){
 const z=top(tip.x,tip.y);
 assert(Number.isFinite(z)&&Math.abs(z-tip.z)<0.05);
 assert(seat.lipHeight(tip.theta)>seat.sampleTop(tip.r,tip.theta));
}
assert.equal(Buffer.from(mesh.positions.buffer,mesh.positions.byteOffset,mesh.positions.byteLength).toString('base64'),original);
let count=0;
for(const p of B.presets){
 const fit=B.fitForMount(p,wibble);
 if(!fit.ok){
   assert(fit.minimum>220,'Only designs exceeding the max physically should be blocked');
   assert.throws(()=>B.build(p,wibble),/Diámetro insuficiente/);
   continue;
 }
 assert(fit.params.diameter>=fit.minimum);
 const shade=B.build(fit.params,wibble);
 assert(api.validate(shade).ok,p.id+' source-driven Wibble shade');
 assert.equal(api.stlBinary(shade).byteLength,84+shade.triangleCount*50);
 count++;
}
assert.equal(count,7,'All seven shapes including Sphere and Disc must fit Wibble');
console.log('PASS Wibble: measured crown seam, original 4 lobes, no adapter, compatible forms build, impossible sizes explicitly blocked');
