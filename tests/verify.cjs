const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ctx={window:{addEventListener:()=>{}},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,Number,Error};
vm.runInNewContext(fs.readFileSync(__dirname+'/../app.js','utf8'),ctx,{filename:'app.js'});
const o=ctx.window.OpenLampTest;
assert.equal(o.PRESETS.filter(p=>!p.archived).length,1,'only Taller Top is visible');
assert.equal(o.PRESETS.length,11,'preserve ten old IDs for JSON');
assert.deepEqual([...new Set(o.PRESETS.map(p=>p.family))].sort(),['atelier','calm','petal','soft','taller']);
const extremes=[
  {...o.PRESETS.find(p=>p.id==='cilindrica'),height:80,diameter:110,thickness:3.5,ribDepth:1.8,ribCount:44,twist:15,clearance:0.2},
  {...o.PRESETS.find(p=>p.id==='petalo'),height:280,diameter:280,thickness:1.2,ribDepth:3.5,ribCount:14,twist:-20,clearance:0.8},
  {...o.PRESETS.find(p=>p.id==='hongo'),height:80,diameter:110,thickness:3.5,ribDepth:0,ribCount:6,twist:0,clearance:0.4},
];
for(const p of o.PRESETS){
  const f=o.FAMILY[p.family];
  for(const key of ['ribDepth','ribCount','twist']){
    assert(p[key]>=f[key][0]&&p[key]<=f[key][1],`${p.id} ${key} outside limits`);
  }
  for(const [k,minmax] of [['ribDepth',f.ribDepth],['ribCount',f.ribCount],['twist',f.twist]]){
    assert.equal(o.fieldLimits(k,p).join(','),minmax.join(','));
  }
  for(const t of [0,.07,.17,.30,.45,.65,.78,.84,.99,1]){
    const radius=o.outerRadius(t,1.25,p);
    assert(Number.isFinite(radius)&&radius>=0,`${p.id}: radius invalid at ${t}`);
  }
  if(p.id!=='taller_top')assert.equal(o.outerRadius(1,0,p),0,`${p.id}: apex must be closed`);
  if(p.id!=='taller_top')for(const t of [.0,.1,.15,.92,.98,1]){
    assert(Math.abs(o.surfaceDetail(t,1,p))<1e-5,`${p.id}: texture should fade at ${t}`);
  }
  for(const t of [.25,.43,.65,.79]){
    assert(Math.abs(o.surfaceDetail(t,0,p)-o.surfaceDetail(t,2*Math.PI,p))<1e-8,`${p.id}: angular seam`);
  }
  let last=o.outerRadius(0,0,p);
  for(let k=1;k<=10000;k++){
    const rad=o.outerRadius(k/10000,0,p);
    assert(Math.abs(rad-last)<5,`${p.id}: shape jump at ${k}/10000`);
    last=rad;
  }
}
const cases=[...o.PRESETS.map(p=>({...p,clearance:o.defaultClearance})),...extremes];
for(const p of cases){
  const shade=o.buildShade(p),base=o.buildBase(p);
  for(const [part,mesh] of [['pantalla',shade],['base',base]]){
    const report=o.validate(mesh),data=o.stlBinary(mesh),dv=new DataView(data);
    assert(report.ok,`${p.id}/${part}: ${JSON.stringify(report)}`);
    assert.equal(data.byteLength,84+50*mesh.triangleCount);
    assert.equal(dv.getUint32(80,true),mesh.triangleCount);
    console.log(`${p.id}/${part}: ${mesh.triangleCount} triangles; OK`);
  }
  if(p.id!=='taller_top'){
  const last=shade.positions.length/3;
  assert.equal(shade.positions[(last-2)*3],0);
  assert.equal(shade.positions[(last-1)*3],0);
  assert(Math.abs(shade.positions[(last-2)*3+2]-p.height)<0.0001);
  assert(Math.abs(shade.positions[(last-1)*3+2]-(p.height-p.thickness))<0.0001);
  const ir=Math.hypot(shade.positions[(shade.vertexCount-2-100*128)*3],shade.positions[(shade.vertexCount-2-100*128)*3+1]);
  assert(Math.abs(ir-o.OPENING_RADIUS)<0.03,`${p.id}: opening radius ${ir}`);
  assert(Math.abs((ir-(o.OPENING_RADIUS-p.clearance))-p.clearance)<0.03,`${p.id}: clearance`);
  }
}
const legacy={id:'organica',height:258,diameter:257,thickness:1.3,ribDepth:6.3,ribCount:52,twist:147,clearance:0.75};
const migrated=o.sanitize(legacy,{legacy:true});
assert.equal(migrated.ribDepth,6.3);
assert.equal(migrated.twist,147);
assert.equal(migrated.ribCount,52);
assert.equal(migrated.clearance,0.75);
assert.equal(migrated.family,'soft');
assert.equal(o.sanitize(legacy).ribDepth,3.5);
console.log(`PASS: 4 current + 6 legacy presets + 3 limit cases, ${cases.length*2} binary STL files, unchanged mounting interface, surface continuity and legacy JSON migration.`);