// Regression test: fix OBJ triangle-soup topology without changing ONE triangle vertex position.
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const context={window:{addEventListener:()=>{}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context,{filename:'app.js'});
const api=context.window.OpenLampTest;
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/taller-stand.olmesh.gz')));
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const original=api.parseStandMesh(buffer),repaired=api.weldCoincidentVertices(original);

assert.equal(original.vertexCount,19210);
assert.equal(original.triangleCount,19196);
assert.equal(api.validate(original).ok,false,'source OBJ keeps split vertices');
assert.equal(repaired.vertexCount,9600,'exact coordinate welding must use 9600 vertices');
assert.equal(repaired.triangleCount,original.triangleCount,'no triangles may be lost');
const result=api.validate(repaired);
assert(result.ok,JSON.stringify(result));
assert(result.volume>0);

for(let i=0;i<original.indices.length;i++){
  const before=original.indices[i]*3,after=repaired.indices[i]*3;
  for(let j=0;j<3;j++){
    assert.equal(repaired.positions[after+j],original.positions[before+j],
      'No triangle corner may move, at corner '+i+' coordinate '+j);
  }
}
const stl=api.stlBinary(repaired);
assert.equal(stl.byteLength,84+repaired.triangleCount*50);
assert.equal(new DataView(stl).getUint32(80,true),19196);
const again=api.weldCoincidentVertices(repaired);
assert.equal(again.vertexCount,repaired.vertexCount,'welding must be idempotent');
console.log('PASS Taller Stand: 19196 unchanged triangles, 9600 shared vertices; watertight, oriented, positive volume; exact triangle coordinates unchanged; valid binary STL.');
