# OpenLamp Studio v1.7 — Wibble: unión morfológica exterior e interior

## Objetivo visual

La pantalla tiene que **asentarse sobre Wibble**, no quedar flotando sobre los cuatro lóbulos y no presentar un embudo, falda acampanada, cuello exterior o pieza adaptadora. Las **vistas laterales y la sección** son el criterio de diseño.

## Corrección aplicada

- El Wibble original queda intacto.
- El contacto interno sigue usando una geometría complementaria calculada desde sus triángulos originales.
- La altura del **borde exterior de Shade varía según el ángulo**: `lipHeight(theta)` sale de muestrear las coronas reales en un rango radial de 58 a 81 mm, no de una línea de base horizontal.
- La pared del Shade conecta ese borde con la silueta elegida mediante una deformación **vertical limitada al tramo inferior** `conformedLipZ`. No se crea ninguna transición radial ensanchada.
- `visualRadiusAt()` conserva exactamente `radiusAt()` para todo ángulo y altura. La geometría de Wibble ya no inventa otra forma exterior.
- La superficie interior de apoyo se une al borde inferior moldeado sin generar una segunda falda horizontal.
- El macho de Taller y su hembra cilíndrica original **permanecen sin modificaciones**.
- En ambos casos hay **dos sólidos** (Shade + Stand; salvo tapa opcional); la exportación de Shade contiene el montaje integrado.

## Compatibilidad dimensional real

El Cylinder original Ø132 mm **no puede envolver coronas situadas aproximadamente a 73 mm del eje**. El sistema ahora verifica `requiredDiameter(params,mount)`; si la forma lo permite, eleva y **muestra el diámetro real en el control** al seleccionar Wibble, sin fabricar una falsa falda. En las siete formas de referencia, se pueden acomodar **cinco** dentro del límite comercial actual de Ø220 mm. **Sphere y Disc** exceden ese límite con su perfil inferior actual; en Wibble aparecen deshabilitadas y no se afirma una unión falsa. En Taller están disponibles las siete.

## Pruebas automáticas

- `tests/hidden-socket.cjs`: prueba perfiles Wibble y Taller; rechaza falda artificial, exige una línea de unión no plana y alturas angulares correspondientes a las coronas originales.
- `tests/mount-adapters.cjs`: analiza las cuatro coronas, la elevación angular del labio y la conservación completa de Wibble.
- `tests/morphological-contact.cjs`: prueba contacto interno con vértices y puntos de triángulos STL; controla interferencias muestreadas.
- `tests/wibble-laterals.cjs`: genera **cuatro vistas laterales CAD ortográficas** basadas en la geometría Wibble y Cylinder reales (0°, 45°, 90° y 135°) y comprueba que el labio sigue las coronas, sin ensanchar radialmente el cilindro.
- `tests/browser_shade.py`: prueba seleccionar Wibble/Taller, descargar los STL correctos y deshabilitar las formas geométricamente inviables.
- `.github/workflows/shade-browser.yml`: conserva las vistas laterales SVG y las capturas de controles como artefactos.

## Qué todavía NO está verificado

El contacto CAD muestreado no constituye una certificación global por operaciones booleanas ni garantiza fuerza de retención, ausencia de socavados, estabilidad, resistencia al calor o ajuste impreso. La huella interna es una aproximación 2.5D vertical, concebida para poder instalar Shade sobre la base. El valor nominal de holgura requiere cupones impresos con la impresora, boquilla y material reales. Las vistas laterales constituyen **evidencia geométrica técnica**, no por sí solas una aprobación estética humana definitiva o ensayos físicos.

**Entrega:** `develop` publica en Pages cuando completan CI y browser smoke; `master` se conserva para documentación de negocio.
