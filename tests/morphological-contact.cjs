const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const cx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),cx);
const g=cx.window.OpenLampTest;
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const stand=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const mount=M.mountFor('wibble',stand),seat=mount.integrated;
const N=192;
const source=M.topLobes(stand);
const valleys=[],contacts=[];
assert(source.tips.length===4);
for(const p of B.presets){
 const shade=B.build(p,mount),sections=B.crossSection(p,mount);
 assert(g.validate(shade).ok,p.id+' must remain a closed, valid STL solid');
 const first=sections.findIndex(x=>x.kind==='saddle');
 assert(first>0);
 const ix=(k,j)=>3*(k*N+j%N);
 let tested=0,nearContact=0,minimum=Infinity,maxZ=0,minZ=Infinity;
 // Compare actual source triangles to the tessellated shade saddle at both
 // vertices and face interior: do NOT accept a planar ring or point-only fit.
 for(let k=first;k<first+seat.radialSamples;k++)for(let j=0;j<N;j+=2){
  const next=(j+1)%N,a=ix(k,j),b=ix(k,next),c=ix(k+1,j),d=ix(k+1,next);
  for(const at of [a,b,c,d]){
   const x=shade.positions[at],y=shade.positions[at+1],z=shade.positions[at+2];
   const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
   if(top===null||top<seat.minContactZ-3)continue;
   const clear=z-top;
   assert(clear>=-0.003,p.id+' saddle vertex below original Wibble triangles');
   minimum=Math.min(minimum,clear);tested++;if(clear<.75)nearContact++;
  }
  // The diagonal of the actual triangulation is b-c, not a bilinear patch.
  // Its midpoint lies ON the exported STL triangle edges.
  const x=(shade.positions[b]+shade.positions[c])*.5;
  const y=(shade.positions[b+1]+shade.positions[c+1])*.5;
  const z=(shade.positions[b+2]+shade.positions[c+2])*.5;
  const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
  if(top!==null && top>seat.minContactZ-3){
   const gap=z-top;
   assert(gap>-.12,p.id+' saddle facet penetrates Wibble CAD at an interior sample: '+gap.toFixed(3)+' mm');
  }
 }
 for(let k=first;k<=first+seat.radialSamples;k++)for(let j=0;j<N;j++){
  const z=shade.positions[ix(k,j)+2];
  maxZ=Math.max(maxZ,z);minZ=Math.min(minZ,z);
 }
 assert(tested>75,p.id+' has insufficient Wibble-topography test coverage');
 assert(nearContact>30,p.id+' saddle does not actually approach four Wibble lobes');
 assert(maxZ-minZ>1.2,p.id+' has an effectively flat internal contact');
 assert(minimum>=-.003);
 contacts.push({shape:p.id,nearestMm:minimum.toFixed(3),nearContact,reliefMm:(maxZ-minZ).toFixed(2)});
}
console.log('PASS morphological Wibble contact: triangulated four-lobe negative relief, four tips, 7 shapes, sampled interior clearance');
console.log(JSON.stringify(contacts));
