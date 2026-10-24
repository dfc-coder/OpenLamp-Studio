/* OpenLamp Studio: conservative, source-backed compatibility contracts.
 * All dimensions in millimeters. No kit is validated without a recorded physical test.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OpenLampCompatibility=api;
})(typeof window!=='undefined'?window:undefined,function(){
  'use strict';
  const interfaces=Object.freeze({
    flat:Object.freeze({id:'flat',name:'Taller Stand',seatOuterRadiusMm:34.88,shadeInnerRadiusMm:35.044,
      insertionMm:14.17,verifiedGeometry:true,verifiedPhysical:false}),
    wibble:Object.freeze({id:'wibble',name:'Wibble Stand',seatOuterRadiusMm:null,shadeInnerRadiusMm:35.044,
      insertionMm:null,verifiedGeometry:false,verifiedPhysical:false}),
  });
  const defaults=Object.freeze({type:'none',sku:'',diameterMm:null,heightMm:null,cableDiameterMm:null,
    testRecordId:null});
  function finitePositive(value){return typeof value==='number'&&Number.isFinite(value)&&value>0;}
  function sanitizeHardware(raw){
    const x=raw&&typeof raw==='object'?raw:{};
    return {
      type:['none','led-low-voltage','e27'].includes(x.type)?x.type:'none',
      sku:typeof x.sku==='string'?x.sku.trim().slice(0,120):'',
      diameterMm:finitePositive(x.diameterMm)&&x.diameterMm<=180?x.diameterMm:null,
      heightMm:finitePositive(x.heightMm)&&x.heightMm<=350?x.heightMm:null,
      cableDiameterMm:finitePositive(x.cableDiameterMm)&&x.cableDiameterMm<=20?x.cableDiameterMm:null,
      testRecordId:typeof x.testRecordId==='string'?x.testRecordId.trim().slice(0,100):null,
    };
  }
  // Verified means measured AND physically tested. A user-provided record ID alone
  // is not a verified safety certificate and must never elevate this status.
  function evaluate({baseId,hardware,shadeValid=true,baseValid=true,adapterGenerated=false}={}){
    const mount=interfaces[baseId]||null,h=sanitizeHardware(hardware);
    const blockers=[],warnings=[];
    if(!mount){blockers.push('Base desconocida');}
    if(!shadeValid||!baseValid)blockers.push('Una pieza no pasó la validación geométrica');
    if(mount&&!mount.verifiedGeometry&&!adapterGenerated)blockers.push('No se generó un adaptador geométrico para esta base');
    if(adapterGenerated)warnings.push('Adaptador de Wibble calculado desde la malla original: retención y tolerancias físicas pendientes');
    if(h.type==='none')blockers.push('No se seleccionó un kit de iluminación');
    if(h.type!=='none'){
      if(!h.sku)blockers.push('Falta fabricante/modelo del kit');
      if(!h.diameterMm||!h.heightMm||!h.cableDiameterMm)
        blockers.push('Faltan medidas físicas de cuerpo, altura o cable');
      if(h.type==='e27')warnings.push('E27: solo perfil dimensional; no sustituye un portalámparas certificado');
    }
    if(mount&&mount.verifiedGeometry)warnings.push('Encastre CAD nominal; falta ensayo FDM');
    if(h.type!=='none')warnings.push('El adaptador mecánico no está fabricado ni validado para este SKU');
    warnings.push('Seguridad eléctrica, térmica y estabilidad de la luminaria: no verificadas');
    return {
      baseId,hardware:h,knownMount:!!mount?.verifiedGeometry,adapterPrototype:!!adapterGenerated,
      nominalRadialClearanceMm:mount&&mount.verifiedGeometry?
        Number((mount.shadeInnerRadiusMm-mount.seatOuterRadiusMm).toFixed(3)):null,
      geometryStatus:shadeValid&&baseValid?'valid':'invalid',
      status:blockers.length?'blocked':'prototype',
      blockers,warnings,
      compatibleForProduction:false,
      assemblyExportAllowed:false,
      individualStlExportAllowed:shadeValid&&baseValid,
    };
  }
  return Object.freeze({interfaces,defaults,sanitizeHardware,evaluate});
});