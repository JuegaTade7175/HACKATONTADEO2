# TropelCare Control Room — Pizza Protocol

Este es el frontend para la consola operativa de administración de criaturas digitales llamadas **Tropeles**, pertenecientes a la colonia virtual de Tuckersoft.

## Integrantes del Equipo

* **Tadeo Joaquín Cárdenas Soto** - Código `202510004`
* **Víctor Valentino Palomino Arcos** - Código `202510026`
* **John Dayron Blas Huete** - Código `202510794`

## Despliegue

* **Link del Deploy:** pendiente de publicar en Vercel/Netlify.

---

## Decisiones Técnicas Clave

### 1. Validación de Sesión y Restauración (`/auth/me`)

* Al cargar o recargar la página, se intercepta la sesión. Si existe un token almacenado en local, se realiza una verificación llamando al endpoint `GET /auth/me`.
* Durante la verificación, se presenta una pantalla de carga para evitar saltos o redirecciones incorrectas a la pantalla de login. Si la sesión es inválida, se limpian las credenciales de inmediato.

### 2. Filtros Combinables Sincronizados con URL (Check 2)

* Los filtros de búsqueda de Tropeles por `q` (búsqueda por texto), `species` (especie), `vitalState` (estado vital), `sectorId` (sector operativo) y el orden (`sort`) están completamente sincronizados con la URL mediante `searchParams`.
* La lista de sectores disponibles se carga dinámicamente desde el backend (`GET /sectors`) al abrir los filtros para permitir la clasificación exacta por sector.
* Al modificar cualquier filtro, la paginación se restablece automáticamente a la primera página (`page=0`).

### 3. Conservación de Posición del Feed y Deduplicación (Check 3)

* Para cumplir con la restricción de conservar la posición del scroll y los elementos cargados al entrar y salir del detalle de una señal, se implementó un sistema de almacenamiento temporal en `sessionStorage` que guarda el estado de los items del feed, cursor de paginación y la posición del scroll.
* Al presionar el botón de regresar o volver al feed, se valida si el estado guardado coincide con los filtros URL activos. Si coincide, se restaura el feed completo instantáneamente y el scroll vuelve a colocarse de forma idéntica en la posición anterior mediante una microtarea retardada.
* Se agregó deduplicación estricta por identificador de señal (`id`) para evitar la renderización de duplicados si ocurren llamadas concurrentes.

### 4. Sincronización Inmediata del Estado de Señales (Check 4)

* Al cambiar el estado de una señal a `PROCESANDO` o `ATENDIDA` en la vista de detalle y actualizar exitosamente contra la API, se realiza una actualización en caliente dentro del cache local de `sessionStorage`. Así, cuando el operador pulsa "Volver al feed", el nuevo estado se refleja de inmediato sin realizar peticiones innecesarias al servidor.
* Se muestra un banner confirmatorio al guardar con éxito, y alertas de error claras que contienen un botón interactivo de "Reintentar" si la petición falla en vuelo.

### 5. Experiencia Sector Story Engine (Check 5)

* **CSS Scroll-driven Animations:** Se implementó una línea de tiempo visual mediante CSS nativo para revelar gradualmente las tarjetas de la historia conforme entran al viewport mediante `view-timeline` y `@keyframes`. En navegadores antiguos sin soporte, se utiliza un fallback nativo reactivo usando `IntersectionObserver` que calcula el índice activo.
* **View Transition API:** Las transiciones de navegación entre la lista resumen de sectores del dashboard y la historia detallada utilizan `viewTransition` y `document.startViewTransition` nativo para brindar transiciones fluidas de fundido y desplazamiento sin librerías externas.
* **Soporte de Accesibilidad:** Se añade soporte explícito para `@media (prefers-reduced-motion: reduce)`, desactivando transiciones pesadas o escalados bruscos. La navegación mediante teclado (`Tab`) enfoca las tarjetas correspondientes y las desplaza de forma fluida hacia el centro de la pantalla (`scrollIntoView`) para mantener el orden.

---

## Instalación y Comandos

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Ejecutar en entorno de desarrollo:**

   ```bash
   npm run dev
   ```

3. **Verificar tipos de TypeScript:**

   ```bash
   npm run typecheck
   ```

4. **Compilar para producción:**

   ```bash
   npm run build
   ```

5. **Revisar estilo y errores estáticos:**

   ```bash
   npm run lint
   ```

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con la URL base del API provista por el docente:

```properties
VITE_API_BASE_URL=https://hackaton-20261-front-587720740455.us-east1.run.app
```
