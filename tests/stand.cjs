// Regression check: imported and optimized Wibble mesh is decodable and printable as a solid.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const context = {window:{addEventListener:()=>{}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context,{filename:'app.js'});
const api=context.window.OpenLampTest;
const gz=fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz'));
const raw=zlib.gunzipSync(gz);
// Convert a Buffer to an exact standalone ArrayBuffer, not its pooled backing store.
const buffer=raw.buffer.slice(raw.byteOffset, raw.byteOffset+raw.byteLength);
const mesh=api.parseStandMesh(buffer);
const quality=api.validate(mesh);
assert.equal(quality.ok,true,JSON.stringify(quality));
assert.equal(mesh.triangleCount,19220);
assert.equal(mesh.vertexCount,9594);
assert(mesh.positions.every(Number.isFinite));
const bounds=[Math.min(...Array.from(mesh.positions).filter((_,i)=>i%3===2)),Math.max(...Array.from(mesh.positions).filter((_,i)=>i%3===2))];
assert(bounds[0]>-0.01&&bounds[1]>199.3&&bounds[1]<199.5);
const stl=api.stlBinary(mesh);
assert.equal(stl.byteLength,84+mesh.triangleCount*50);
const tri=new DataView(stl).getUint32(80,true);assert.equal(tri,mesh.triangleCount);
console.log('PASS Wibble stand: optimized original,',mesh.triangleCount,'triangles, valid oriented closed mesh; height',bounds[1].toFixed(3),'mm; compressed',gz.length,'bytes; binary STL',stl.byteLength,'bytes');
