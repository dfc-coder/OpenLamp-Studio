# Desarrollo (rama develop)

## Uso local
No hay servidor ni dependencias de instalación obligatorias:

```bash
python3 -m http.server 8000
```

Abrir http://localhost:8000. El editor utiliza `app.js` y `styles.css` directamente. Para la vista tridimensional se carga Plotly.js 3.3.1 desde su CDN, por lo que **ese visor requiere conexión externa**; cuando falta WebGL/Plotly aparece un esquema 2D identificado.

## Pruebas
Requiere Node.js (sin instalación npm para estos tests).

```bash
node --check app.js
node tests/verify.cjs
mkdir -p examples
node tests/export.cjs
```

`verify.cjs` valida presets, geometría, STL y migración JSON. `export.cjs` genera STL en `examples/` (salidas ignoradas por Git). No inferir de estas pruebas que la iluminación sea segura o que el visor 3D fue probado.

## Estructura
- `app.js`: perfiles Bézier, deformación de superficie, generación malla/base, STL y controles.
- `index.html`, `styles.css`: UI estática.
- `tests/`: validación reproducible con Node.
- `examples/`: STL generados localmente.

## Próximas mejoras
Editor visual de puntos Bézier; importación auditada de STL/OBJ/STEP; pruebas E2E WebGL y verificación en OrcaSlicer. Estas funciones no se deben anunciar como terminadas.

## Git
Todos los cambios de aplicación van a `develop` mediante PR cuando corresponda. `master` conserva documentos fundacionales y versiones aprobadas. Consultar [CONTRIBUTING.md](CONTRIBUTING.md).
