# Hoja de ruta por entregas controladas

## Fase 0 — Repositorio y gobernanza
- Documentación de negocio y producto en `master`.
- `develop` creado desde `master`, sin desarrollo directo sobre rama estable.
- Reglas de contribución y convenciones de commits.
- Registro de pruebas y limitaciones conocidas.

## Fase 1 — Baseline ejecutable (develop)
- Integrar demo local existente como primera revisión, sin reescribirla.
- Fijar dependencias, README técnico y scripts reproducibles.
- CI: sintaxis, geometría, exportación y pruebas del navegador disponibles.
- Registrar que WebGL e impresión física necesitan validaciones separadas.

## Fase 2 — Perfiles y edición estética
- Seis siluetas clásicas.
- Edición visual o parametrización de Bézier.
- Limitar relieves sin romper dimensiones del acople.
- Comparaciones visuales reproducibles y aprobación humana.

## Fase 3 — Modelos aportados
- Flujo de auditoría STL/OBJ/STEP.
- Licencias, importación y medidas.
- Preset paramétrico cuando sea viable, fijo en caso contrario.
- Ensayos de compatibilidad con la base.

## Fase 4 — Beta externa
- Revisar usabilidad, navegación, exportaciones y resultados de slicer.
- Obtener feedback y métricas de pilotos voluntarios.
- Pulir accesibilidad y responsive; publicar demo.

## Fase 5 — Montaje eléctrico validado
- Elegir kits LED y E27 comerciales concretos.
- Medir, prototipar, ensayar montaje y límites térmicos/eléctricos.
- Solo entonces publicar adaptadores o compatibilidad.

**Regla:** ninguna fase se considera cerrada sin evidencias y criterios de aceptación; cambios del código siempre comienzan en `develop`.
