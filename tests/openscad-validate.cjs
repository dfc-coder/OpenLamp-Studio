/** Independent CAD validation: generate actual OpenLamp STL and force OpenSCAD CGAL.
 * No preview-only success: failing OpenSCAD aborts the GitHub Pages build.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process'),zlib=require('node:zlib'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const context={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context);
const geo=context.window.OpenLampTest;
const outDir=path.resolve(process.env.OPENLAMP_CAD_DIR||path.join(os.tmpdir(),'openlamp-openscad-qa'));
fs.mkdirSync(outDir,{recursive:true});
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const wibble=geo.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
assert(geo.validate(wibble).ok,'Wibble source is not manifold');
const mounts={flat:M.mountFor('flat',wibble),wibble:M.mountFor('wibble',wibble)};
const records=[];
function inspect(name,mesh){
 assert(geo.validate(mesh).ok,'Internal OpenLamp mesh validation failed: '+name);
 const input=path.join(outDir,name+'.stl');
 const result=path.join(outDir,name+'.cgal.stl');
 fs.writeFileSync(input,Buffer.from(geo.stlBinary(mesh)));
 // A trivial CSG difference FORCES the CGAL backend. A plain import/export
 // would not (it only copies STL triangles), thus is not a valid CAD audit.
 const scad=path.join(outDir,name+'.scad');
 const escaped=input.replaceAll('\\','/').replaceAll('"','\\"');
 fs.writeFileSync(scad,'difference() { import("'+escaped+'",convexity=10); translate([10000,10000,10000]) cube(1); }\n');
 const p=cp.spawnSync('openscad',['-o',result,scad],{
  env:{...process.env,QT_QPA_PLATFORM:'offscreen'},encoding:'utf8',
  timeout:120000,maxBuffer:6*1024*1024});
 if(p.error||p.status!==0){
  throw Error('OpenSCAD rejected '+name+' ('+p.status+'): '+(p.stderr||p.stdout||p.error));
 }
 const output=(p.stderr||'')+'\n'+(p.stdout||'');
 if(/ERROR:|WARNING:.*(manifold|mesh|polyhedron|repair|not closed|invalid)/i.test(output))
  throw Error('OpenSCAD reported invalid mesh '+name+': '+output);
 const simple=/Simple:\s*yes/i.test(output);
 const volume=/Volumes:\s*(\d+)/i.exec(output);
 if(!simple||!volume||Number(volume[1])!==2)
  throw Error('OpenSCAD CGAL did not confirm one closed solid for '+name+': '+output);
 assert(fs.statSync(result).size>80,'Empty OpenSCAD reexport: '+name);
 const data={name,sourceTriangles:mesh.triangleCount,cgalVolumes:Number(volume[1]),
   cgalBytes:fs.statSync(result).size};
 records.push(data);console.log('OPENSCAD PASS '+JSON.stringify(data));
}
inspect('source-wibble',wibble);
for(const p of B.presets){
 const direct=B.build(p,mounts.flat);
 inspect('taller-'+p.id,direct);
 const fit=B.fitForMount(p,mounts.wibble);
 assert(fit.ok,'Cannot build '+p.name+' on Wibble: '+fit.reason);
 const m=B.build(fit.params,mounts.wibble);
 inspect('wibble-'+p.id,m);
}
fs.writeFileSync(path.join(outDir,'cad-report.json'),JSON.stringify(records,null,2));
assert.equal(records.length,15);
console.log('PASS OpenSCAD CGAL: Wibble source and 14 true shade STLs, including Sphere and Disc');
