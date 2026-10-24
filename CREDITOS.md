# Créditos y limitaciones

OpenLamp Studio v0.3, demo experimental, MIT.

- El adaptador geométrico utiliza el principio de barrido de perfiles polares y el enfoque de mallas trianguladas de [VaseMaker](https://github.com/dcityorg/vasemaker), © 2025 Gary Muhonen (MIT). El proyecto no es un fork completo de VaseMaker.
- Visor web con [Plotly.js](https://github.com/plotly/plotly.js), © Plotly, Inc. (MIT), conservado con su licencia en `vendor/LICENSE`.
- Las dos mallas se escriben como STL binario en milímetros, que es una convención del proyecto (STL no registra unidades).

La pantalla cierra arriba y queda abierta por debajo. El pie tiene asiento circular y canal inferior de paso de cable. Son piezas experimentales, no certificadas para usar con corriente de red. La geometría no incluye un portalámparas E27, un módulo LED, conexiones eléctricas ni mecanismos de retención certificados. **No afirmar que se adaptan a un kit LED/E27 concreto sin medidas y pruebas físicas**. El encastre FDM depende del material, de la impresora y de las tolerancias reales; ensayar antes de utilizar.

Las comprobaciones de malla comprueban coordenadas finitas, cero triángulos degenerados, aristas con dos caras de orientación opuesta y volumen positivo. Se verificaron los 12 STL nominales con Trimesh. Estas comprobaciones no demuestran ausencia de autointersecciones para cualquier combinación, imprimibilidad sin soportes, estabilidad, temperatura ni seguridad eléctrica.


## Stand Wibble (malla aportada por el usuario)

- Diseñador y derechos originales: **Abstractia Design**. Archivo de origen: `Both+Parts.3mf` (componente `stand.obj`).
- Integrado **con permiso expreso de reutilización/redistribución indicado por el usuario**. No se asume que el modelo original ni sus derivados están bajo la licencia MIT del código OpenLamp. Antes de redistribuir de forma comercial, conservar el alcance del permiso firmado por su titular.
- Adaptación técnica: centrar el stand y desplazar el apoyo a z=0; decimación de malla, no rediseño de la forma. Se exporta como STL desde la misma superficie optimizada.
- Compatibilidad con pantalla OpenLamp: **no verificada**. Selección estética ≠ encastre funcional o validación eléctrica.
- No se ha aplicado marca/logo alguno: requiere un SVG autorizado y ubicación geométrica elegida.
