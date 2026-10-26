const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const M=require('../mount-adapters.js'),B=require('../basic-shade.js');
const cx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),cx);
const a=cx.window.OpenLampTest;
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const stand=a.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
assert(a.validate(stand).ok);
const before=Buffer.from(stand.positions.buffer,stand.positions.byteOffset,stand.positions.byteLength).toString('base64');
const taller=M.mountFor('flat',stand),wibble=M.mountFor('wibble',stand);
assert.equal(taller.adapter,null);assert.equal(wibble.adapter,null,'Do not generate any green bridge');
assert.equal(taller.interface.kind,'direct');
assert.equal(wibble.interface.kind,'integrated-saddle');
assert.equal(wibble.contactSites,4);
assert.equal(wibble.integrated.tipRadii.length,4);
assert(wibble.shadeBottom>190&&wibble.shadeBottom<210);
assert(Math.abs((wibble.integrated.contactUndersideZ-wibble.integrated.skirtDrop)-M.WIBBLE_CONTACT_GAP)<1e-8);
assert.equal(wibble.integrated.contactTopZ-wibble.integrated.contactUndersideZ,3.5);
assert.strictEqual(M.mountFor('wibble',stand),wibble,'Indexed Wibble geometry must be cached');
const source=M.topLobes(stand),sample=M.upperSurfaceSampler(stand,source.zTop-26);
for(const tip of source.tips){
 const z=sample(tip.x,tip.y);
 assert(Number.isFinite(z)&&Math.abs(z-tip.z)<0.05,'Landing support must reference real tip geometry');
 assert(tip.r>wibble.integrated.innerShelfRadius);
 assert(tip.r<wibble.integrated.requiredExteriorRadius-B.presets[0].thickness);
 const seatUnderside=wibble.shadeBottom+wibble.integrated.contactUndersideZ;
 assert(seatUnderside-z>=M.WIBBLE_CONTACT_GAP-0.05);
 assert(seatUnderside-z<=M.WIBBLE_CONTACT_GAP+0.08);
}
assert.equal(Buffer.from(stand.positions.buffer,stand.positions.byteOffset,stand.positions.byteLength).toString('base64'),before,'Original Wibble coordinates changed');
for(const p of B.presets){
 const shade=B.build(p,wibble);
 assert(a.validate(shade).ok,p.id+' integrated shade must be manifold');
 assert.equal(shade.indices.length/3,shade.triangleCount);
 assert.equal(a.stlBinary(shade).byteLength,84+50*shade.triangleCount);
}
assert.equal(typeof M.buildWibbleBridge,'undefined','Old green bridge builder must not be exported');
console.log('PASS Wibble: original four tips sampled, internal saddle in Shade, 2 solids, no green adapter, closed STL');
