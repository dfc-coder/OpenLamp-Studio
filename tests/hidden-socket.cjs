const assert=require('node:assert/strict');
const zlib=require('node:zlib'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const root=path.resolve(__dirname,'..');
const cx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),cx);
const g=cx.window.OpenLampTest;
const compressed=fs.readFileSync(path.join(root,'assets/stands/wibble-stand.olmesh.gz'));
const raw=zlib.gunzipSync(compressed);
const wibble=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length));
const mounts={flat:M.mountFor('flat',wibble),wibble:M.mountFor('wibble',wibble)};
assert.equal(mounts.flat.adapter,null);
assert(mounts.wibble.adapter);
let checked=0;
for(const p of B.presets){
 const shell=B.build(p);
 assert(g.validate(shell).ok,p.id+' shell manifold');
 const sections=B.crossSection(p);
 assert(sections.some(x=>x.kind==='plain'&&x.r===B.INNER_MOUNT&&x.z===0));
 assert(sections.some(x=>x.kind==='plain'&&x.r===B.INNER_MOUNT&&x.z===B.SOCKET_ROOF));
 assert(sections.some(x=>x.kind==='plain'&&x.r===B.INNER_MOUNT+B.SOCKET_WALL&&x.z===B.SOCKET_UNDERSIDE));
 const visualBottom=Math.hypot(shell.positions[0],shell.positions[1]);
 assert(Math.abs(visualBottom-B.radiusAt(0,p))<0.001,'No exterior neck '+p.id);
 assert(visualBottom>B.INNER_MOUNT+B.SOCKET_WALL+p.thickness+B.MIN_LIGAMENT-0.001);
 for(const [base,m] of Object.entries(mounts)){
  // Socket remains the same standardized female across both base choices.
  const maleTop=base==='flat'?35.59607:m.bridgeProfile.seatTop;
  const maleBottom=maleTop-B.INSERTION;
  const depth=maleTop-m.shadeBottom;
  assert(depth>13&&depth<=B.INSERTION);
  assert(m.shadeBottom-maleBottom>0,'No collision with horizontal base platform');
  assert(B.SOCKET_UNDERSIDE-depth>2,'Adapter seat must not collide with underside of upper web');
  assert(Math.abs(m.interface.socketInnerRadius-B.INNER_MOUNT)<0.00001);
  assert(Math.abs(m.interface.seatOuterRadius-34.880)<.00001);
  assert(Math.abs(m.interface.socketInnerRadius-m.interface.seatOuterRadius-0.164)<1e-6);
  assert(m.shadeBottom>=0);
  checked++;
 }
}
for(const shape of ['sphere','disc']){
 const p=B.presets.find(x=>x.id==='basic_'+shape);
 assert(!B.validateParams({...p,diameter:110}).ok,
   shape+' impossible socket must be rejected, not visually tapered');
}
assert.equal(checked,14);
console.log('PASS 14 hidden-socket assemblies: true exterior silhouette, linked inner sleeve, insertion, non-collision heights, 2 bases');
