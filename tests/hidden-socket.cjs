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
 assert(wCross.filter(x=>x.kind==='saddle').length===mounts.wibble.integrated.radialSamples+1);
 const outer=(mesh)=>Math.hypot(mesh.positions[0],mesh.positions[1]);
 assert(Math.abs(outer(flat)-B.radiusAt(0,p))<0.001,'Taller exterior must be identical');
 assert(Math.abs(outer(integrated)-B.visualRadiusAt(0,p,mounts.wibble,0))<0.001);
 // Unlike the previous circular bloated skirt, this is a four-lobe
 // envelope measured at the actual angles of the four upper Wibble tips.
 const top=M.topLobes(wibble);
 for(const tip of top.tips){
   const j=Math.round(((tip.theta%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*192)%192;
   const i=3*j,r=Math.hypot(integrated.positions[i],integrated.positions[i+1]);
   assert(r>tip.r+5,'Shaped skirt must enclose the original upper crown');
 }
 assert(B.visualRadiusAt(1,p,mounts.wibble,top.tips[0].theta)===B.radiusAt(1,p),
   'Ergonomic flare must disappear in the upper original silhouette');
 for(const z of [0,4,8,16]){
  const r=B.visualRadiusAt(z/p.height,p,mounts.wibble);
  assert(r-p.thickness-mounts.wibble.integrated.innerShelfRadius>5,
   'Landing shelf must fit inside printed wall at z='+z);
 }
 // The new concave contact follows each source triangle tip within the
 // small CAD fitting allowance; a flat annulus cannot pass this test.
 const seat=mounts.wibble.integrated;
 for(const tip of top.tips){
   const underside=B.saddleUndersideAt(tip.r,tip.theta,seat)+mounts.wibble.shadeBottom;
   assert(Math.abs(underside-tip.z-seat.contactClearance)<0.07,
     'The underside must follow the Wibble mesh, not an arbitrary planar Z');
 }
 const sec=wCross.findIndex(x=>x.kind==='saddle');
 const zValues=[];
 for(let j=0;j<192;j++)zValues.push(integrated.positions[(sec+7)*192*3+j*3+2]);
 assert(Math.max(...zValues)-Math.min(...zValues)>0.7,'Contact cannot be a flat ring');
 assert(mounts.flat.adapter===null&&mounts.wibble.adapter===null);
 checked+=2;
}
assert.equal(checked,14);
console.log('PASS 14 dual-base shades: Taller unchanged, Wibble integrated ergonomic skirt + conformal four-tip sockets, no third solid');
