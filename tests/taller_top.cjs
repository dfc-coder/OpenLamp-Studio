const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const ctx={window:{addEventListener:()=>{}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),ctx,{filename:'app.js'});
const api=ctx.window.OpenLampTest;
const shade=api.PRESETS.find(p=>p.id==='taller_top');
assert(shade&&shade.archived);
for(const mode of ['open','flat','curved'])for(const height of [160,228,300])for(const diameter of [110,131.2,210]){
 const p={...shade,topMode:mode,height,diameter,clearance:.4};
 const m=api.buildShade(p),v=api.validate(m);
 assert(v.ok,mode+' '+height+' '+diameter+' '+JSON.stringify(v));
 const R=mode==='curved'?119:101;
 assert(Math.abs(m.positions[R*128*3]-api.TALLER_MOUNT_INNER_RADIUS)<.002,'mounting radius drift');
 assert(Math.abs(m.positions[0]-65.599)<.01,'lower skirt drift');
 const stl=api.stlBinary(m);
 assert.equal(stl.byteLength,84+50*m.triangleCount);
}
const low={...shade,diameter:110},high={...shade,diameter:210};
for(const t of [0,.02,.05,.08])assert(Math.abs(api.tallerOuterRadius(t,0,low)-api.tallerOuterRadius(t,0,high))<.0001);
assert(Math.abs(api.tallerOuterRadius(.7,0,low)-api.tallerOuterRadius(.7,0,high))>10);
assert.equal(api.PRESETS.filter(p=>!p.archived).length,1);
console.log('PASS Taller Top: 27 modes/heights/diameters; invariant mount and valid STL');
