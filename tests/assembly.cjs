// CAD shared-coordinate fit check: original shade/base remain unchanged.
// Geometry validation cannot certify printed fit, materials, heat or electrical safety.
const fs=require('node:fs'), path=require('node:path'), zlib=require('node:zlib'), assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx={window:{addEventListener(){}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx);
const api=ctx.window.OpenLampTest;
const exactBuffer=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const baseRaw=zlib.gunzipSync(fs.readFileSync(path.join(root,'assets/stands/taller-stand.olmesh.gz')));
const base=api.weldCoincidentVertices(api.parseStandMesh(exactBuffer(baseRaw)));
assert(api.validate(base).ok,'base must be manifold after vertex welding');
const partBuffers=[];
for(let i=0;i<19;i++)partBuffers.push(fs.readFileSync(path.join(root,'assets','shades','tallertop-original.olmesh.gz.part-'+String(i).padStart(2,'0'))));
const shadeRaw=zlib.gunzipSync(Buffer.concat(partBuffers));
const shade=api.parseStandMesh(exactBuffer(shadeRaw));
assert.equal(shade.triangleCount,684792);
const bounds=mesh=>{
  let lo=Infinity,hi=-Infinity;
  for(let i=2;i<mesh.positions.length;i+=3){const z=mesh.positions[i];lo=Math.min(lo,z);hi=Math.max(hi,z);}
  return [lo,hi];
};
const [bzmin,bzmax]=bounds(base),[szmin,szmax]=bounds(shade);
const initialBaseCADZ=-102.31434631;
const sourceShadeLow=szmin-initialBaseCADZ;
assert(Math.abs(bzmin)<1e-4,'base must rest on Z=0');
const insertion=bzmax-sourceShadeLow;
assert(insertion>14&&insertion<14.5,'preserve original CAD overlap (about 14.17mm): '+insertion);
let seatOuter=0;
for(let i=0;i<base.positions.length;i+=3){
 if(Math.abs(base.positions[i+2]-bzmax)<1e-4)seatOuter=Math.max(seatOuter,Math.hypot(base.positions[i],base.positions[i+1]));
}
let shadeInner=Infinity;
for(let i=0;i<shade.positions.length;i+=3){
 if(Math.abs(shade.positions[i+2]-szmin)<1e-4)shadeInner=Math.min(shadeInner,Math.hypot(shade.positions[i],shade.positions[i+1]));
}
const radialClearance=shadeInner-seatOuter;
assert(radialClearance>0.1&&radialClearance<0.4,'source CAD seat/shade radial clearance unexpectedly changed: '+radialClearance);
console.log('PASS CAD assembly: nominal radial clearance',radialClearance.toFixed(3),'mm, insertion',insertion.toFixed(3),'mm. No alterations to source STL surfaces; physical fit unverified.');
