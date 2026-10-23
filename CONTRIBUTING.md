# Contribuir a OpenLamp Studio

## Ramas
- `master` — visión, negocio, documentación pública estable y publicaciones aprobadas.
- `develop` — rama principal de implementación, código de aplicación, pruebas y artefactos de demo.
- `feature/<tema>` — trabajos puntuales que se integran por PR contra `develop`.
- `fix/<tema>` — correcciones puntuales, PR contra `develop`.

No hacer commits de código directamente en `master`. La promoción de una versión aprobada se hace mediante PR desde `develop` a `master`, con pruebas y revisión.

## Commits
Usar Conventional Commits: `docs:`, `feat:`, `fix:`, `test:`, `refactor:`, `chore:`.

## Pull requests
Incluir objetivo, alcance, archivos modificados, pruebas ejecutadas y capturas si cambia la estética. Documentar límites de impresión y montaje, no presentar una hipótesis como comprobación.

## Política de reutilización
No duplicar un componente ya probado sin justificarlo. Mantener interfaces simples y atribuciones OSS. Nunca agregar secretos, binarios enormes generados por tests o modelos de terceros sin licencia.

## Definición de hecho
Pruebas pertinentes verdes, archivos exportados verificables, compatibilidad JSON mantenida, ningún cambio accidental del diámetro/asiento de montaje, documentación actualizada y, para nuevas siluetas, capturas comparativas.

## Preparación de release
1. Cerrar bloqueadores en `develop`.
2. Verificar CI y tests relevantes.
3. Revisar licencia, seguridad y experiencia de usuario.
4. Abrir PR de promoción a `master`.
5. Etiquetar versión solamente después de aprobación.

Las ramas protegidas y revisiones obligatorias deben configurarse en GitHub Settings cuando las opciones del plan de cuenta lo permitan.
