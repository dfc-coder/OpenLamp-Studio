const assert=require('node:assert/strict');
const D=require('../shade-design.js');
assert.deepEqual(Object.keys(D.families),['original','vertical','soft','flared']);
assert.deepEqual(D.preset('original').offsets,[0,0,0,0,0]);
for(const family of ['original','vertical','soft','flared']){
 const f=D.families[family],shape=D.preset(family),curve=D.makeCurve(shape);
 assert.equal(curve(0),0,'Mount point must never move');
 assert(D.validateShape(shape,(f.height[0]+f.height[1])/2,(f.diameter[0]+f.diameter[1])/2).ok,
   'Default family invalid: '+family);
 for(let i=0;i<=1000;i++){
  const y=curve(i/1000);
  assert(Number.isFinite(y));
  assert(y>=Math.min(...shape.offsets)-1e-8&&y<=Math.max(...shape.offsets)+1e-8,
   'Overshoot: '+family);
 }
 for(let k=1;k<D.KNOTS.length-1;k++){
  const x=D.KNOTS[k],eps=1e-5;
  assert(Math.abs((curve(x)-curve(x-eps))/eps-(curve(x+eps)-curve(x))/eps)<0.1,
   'Lost G1 tangent at '+family+' '+k);
 }
 assert(!D.validateShape(shape,f.height[1]+10,f.diameter[0]).ok);
 assert(!D.validateShape(shape,f.height[0],f.diameter[1]+10).ok);
}
const clamped=D.normalize({family:'soft',offsets:[100,100,100,100,100]});
clamped.offsets.forEach((x,i)=>assert(x<=D.families.soft.limits[i][1]));
const mock={positions:new Float32Array([20,0,0,24,0,0.1,20,0,5,25,0,5.1,30,0,10,32,0,10.1])};
const envelope=D.extractEnvelope(mock,0,10,10);
assert.equal(envelope.length,10);
assert(envelope.every(p=>Number.isFinite(p.radius)&&p.radius>0));
assert.equal(D.sampleProfile(envelope,D.preset('original')).length,10);
console.log('PASS Shade grammar: 3 curated families, strict bounds, tangent continuity, no curve overshoot, master profile');