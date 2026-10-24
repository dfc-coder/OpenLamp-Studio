const fs=require('node:fs'),zlib=require('node:zlib'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const chunks=[];for(let i=0;i<19;i++)chunks.push(fs.readFileSync(path.join(root,'assets','shades','tallertop-original.olmesh.gz.part-'+String(i).padStart(2,'0'))));
const raw=zlib.gunzipSync(Buffer.concat(chunks));
const context={window:{addEventListener(){}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const o=context.window.OpenLampTest;
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const original=o.parseStandMesh(buffer);
const originalPreset=o.PRESETS.find(p=>p.id==='tallertop_original');
assert(originalPreset);
const originalOut=o.deformOriginalShade(original,originalPreset);
assert.strictEqual(originalOut,original,'Original default must return same source object, no approximation');
assert.equal(originalOut.triangleCount,684792);
const origMount=[];
for(let i=0;i<original.positions.length;i+=3)if(original.positions[i+2]<=o.DEFORMATION_LOCK_END)origMount.push(i);
for(const [height,diameter,waist,curvature] of [
  [195.142662,131.198182,0,0],
  [245.142662,150.198182,3,0],
  [265.142662,175.198182,-5,5],
  [210.142662,140.198182,5,-5]
]){
 const p={...originalPreset,height,diameter,waist,curvature};
 const result=o.deformOriginalShade(original,p);
 assert.strictEqual(result.indices,original.indices,'Original triangles and their order MUST be preserved');
 for(const i of origMount)for(let j=0;j<3;j++)
   assert.strictEqual(result.positions[i+j],original.positions[i+j],'Mount coordinates must not move');
 const report=o.validateOriginalDeformation(original,result);
 assert(report.ok,'Deformation invalid '+JSON.stringify({height,diameter,waist,curvature,report}));
 // Same face count; export remains a real binary STL.
 assert.equal(o.stlBinary(result).byteLength,84+50*684792);
 console.log('PASS deformation',height,diameter,waist,curvature,'unchanged mounting vertices',origMount.length);
}
for(const type of ['flat','curved']){
 const cap=o.buildTopCap(original,type);
 assert(cap&&cap.triangleCount>300);
 assert(o.validate(cap).ok);
 assert.equal(o.stlBinary(cap).byteLength,84+50*cap.triangleCount);
 console.log('PASS cap',type,cap.triangleCount);
}
assert.equal(o.buildTopCap(original,'original'),null);
console.log('PASS original-mode, source OBJ untouched and separate STL closures');
