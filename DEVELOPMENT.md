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

## Demo pública — GitHub Pages

La rama `master` sigue dedicada a documentación. El workflow [`pages.yml`](.github/workflows/pages.yml) publica **exclusivamente la aplicación de `develop`** en GitHub Pages y se dispara con cada push a esa rama (también admite disparo manual si GitHub lo permite).

### Activación inicial (solo una vez)

1. Ir a [Settings → Pages](https://github.com/dfc-coder/OpenLamp-Studio/settings/pages).
2. En **Build and deployment → Source**, elegir **GitHub Actions** y guardar.
3. Ir a [Actions → Publicar demo en GitHub Pages](https://github.com/dfc-coder/OpenLamp-Studio/actions/workflows/pages.yml) y volver a ejecutar el workflow si el último run terminó en error.

La URL esperada una vez confirmado un despliegue exitoso es: `https://dfc-coder.github.io/OpenLamp-Studio/`. **No asumir que está publicada hasta que Actions informe success y la URL cargue correctamente.**

### Qué publica el workflow

- `index.html`, `app.js`, `styles.css`, `.nojekyll`
- `assets/stands/wibble-stand.olmesh.gz` y `wibble-reference.webp`
- No incluye tests, STL generados, fuentes originales `.3mf` ni documentación interna.

Antes de publicar ejecuta las pruebas de geometría, STL binario y el Wibble optimizado. Si falla cualquier verificación, **no publica**.

### Iteraciones

Los cambios en `develop` desencadenan la validación y despliegue; `master` no se modifica. El visor 3D usa Plotly 3.3.1 desde CDN y requiere red para esa dependencia externa. Los encastres y la compatibilidad LED/E27 siguen experimentales.
