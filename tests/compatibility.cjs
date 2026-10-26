const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../compatibility.js');
const empty=C.evaluate({baseId:'flat',hardware:C.defaults});
assert.equal(empty.status,'blocked');
assert.equal(empty.compatibleForProduction,false);
assert.equal(empty.nominalRadialClearanceMm,0.164);
assert(empty.blockers.some(x=>x.includes('kit')));
const unknown=C.evaluate({baseId:'wibble',hardware:{type:'led-low-voltage',sku:'kit-001',diameterMm:30,heightMm:50,cableDiameterMm:4}});
assert.equal(unknown.status,'blocked');
assert.equal(unknown.knownMount,false);
const wibblePrototype=C.evaluate({baseId:'wibble',adapterGenerated:true,
  hardware:{type:'led-low-voltage',sku:'kit-prototype',diameterMm:30,heightMm:50,cableDiameterMm:4}});
assert.equal(wibblePrototype.adapterPrototype,true);
assert.equal(wibblePrototype.knownMount,false);
assert.equal(wibblePrototype.compatibleForProduction,false);
assert.equal(wibblePrototype.assemblyExportAllowed,false);
assert(wibblePrototype.warnings.some(x=>x.includes('retención')));

assert(unknown.blockers.some(x=>x.includes('interfaz de montaje')));
const integrated=C.evaluate({baseId:'wibble',integratedMount:true,
  hardware:{type:'led-low-voltage',sku:'dimensioned-prototype',diameterMm:30,heightMm:50,cableDiameterMm:4}});
assert.equal(integrated.integratedPrototype,true);
assert.equal(integrated.adapterPrototype,false);
assert.equal(integrated.compatibleForProduction,false);
assert.equal(integrated.assemblyExportAllowed,false);
assert(integrated.warnings.some(x=>x.includes('apoyo interno')));
const measured=C.evaluate({baseId:'flat',hardware:{type:'led-low-voltage',sku:'Test Example',diameterMm:30,heightMm:50,cableDiameterMm:4}});
assert.equal(measured.status,'prototype');
assert.equal(measured.compatibleForProduction,false);
assert.equal(measured.assemblyExportAllowed,false);
assert.equal(measured.individualStlExportAllowed,true);
const untrusted=C.evaluate({baseId:'flat',hardware:{type:'led-low-voltage',sku:'Test Example',diameterMm:30,heightMm:50,cableDiameterMm:4,testRecordId:'random'}});
assert.notEqual(untrusted.compatibleForProduction,true,'User-supplied records must not certify hardware');
const sanitized=C.sanitizeHardware({type:'led-low-voltage',sku:'X'.repeat(999),diameterMm:-10,heightMm:20,cableDiameterMm:5});
assert.equal(sanitized.sku.length,120);
assert.equal(sanitized.diameterMm,null);
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scripts=['compatibility.js','app.js','wizard.js'].map(v=>html.indexOf('src="'+v));
assert(scripts.every(v=>v>0)&&scripts[0]<scripts[1]&&scripts[1]<scripts[2]);
const js=fs.readFileSync(path.join(__dirname,'..','wizard.js'),'utf8');
for(const step of ["shade","bulb","base","surface","make"])
  assert(js.includes("id:'"+step+"'"),'Missing workflow step '+step);
console.log('PASS 5 phases, deterministic compatibility, safe prototype export and contract data');
