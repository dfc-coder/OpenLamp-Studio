# Arquitectura y política de reutilización

## Restricciones
- Aplicación web estática, diseño y STL generados localmente.
- No requiere login, API, almacenamiento remoto ni base de datos.
- Elegir dependencias mantenidas y probadas antes de implementar sustitutos.
- Separación conceptual de perfil, superficies, malla, base, vista previa, exportador y validaciones.
- Modelo único de parámetros con unidades explícitas en mm y versión de esquema JSON.

## Prototipo histórico y decisión
La demo local v0.3.1 utiliza HTML/CSS/JavaScript, Plotly.js para visualización y un adaptador geométrico inspirado en las técnicas de malla de VaseMaker. **No es un fork de VaseMaker**, y nunca debe presentarse como tal.

La fuente experimental se integra y valida exclusivamente en `develop`. La documentación en `master` es el contrato del proyecto y no evidencia de una versión productiva desplegada.

## Reutilización
1. Inventariar necesidad concreta.
2. Revisar si ya está implementada.
3. Evaluar biblioteca, licencia, mantenimiento, tamaño y compatibilidad en navegadores.
4. Integrar la dependencia mínima; mantener atribución.
5. Implementar código nuevo solo para comportamiento de lámpara no cubierto por dependencias.
6. Añadir pruebas para evitar regresiones.

## Geometría objetivo
- Perfiles clásicos de revolución descritos mediante tramos Bézier, con continuidad y límites de curvatura.
- Superficie exterior/interior y cierre superior de espesor real.
- Abertura inferior con interfaz compartida de pantalla/base.
- Patrones superficiales moderados con atenuación en corona y acople.
- Validación matemática: coordenadas finitas, volumen orientado, aristas manifold, STL binario consistente.
- Validación externa: OrcaSlicer y pruebas físicas antes de prometer fabricación.

## Recursos
No cometer modelos de terceros sin permisos. Imágenes y recursos deben tener licencia compatible o permiso explícito. Archivos STEP, STL y OBJ que se integren requieren revisión de autoría, licencia y uso permitido.

## Seguridad y rendimiento
- Entradas numéricas acotadas, JSON validado; evitar ejecución de código al importar un archivo.
- Generación sin envío de diseños a terceros.
- Lazy loading/worker solamente si la medición demuestra necesidad.
- No acumular versiones duplicadas de motores geométricos.
- Proyectos y STL descargados localmente; no almacenar credenciales.
