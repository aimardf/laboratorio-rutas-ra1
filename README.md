# Laberinto de rutas · RA1

## Objetivo

Aplicación web que reproduce un laberinto de rutas: un tablero de 20 × 20
celdas donde se define un inicio, una o varias metas, obstáculos y baldosas
con coste, y sobre el que se ejecutan y comparan cuatro algoritmos de
búsqueda (BFS, DFS, UCS y A*). El proyecto es evidencia del RA1 de PIA
("Caracteriza lenguajes de programación valorando su idoneidad en el
desarrollo de Inteligencia Artificial").

## Tecnologías

- **HTML5** (`index.html`) para la estructura y semántica de la interfaz.
- **CSS3** (`css/styles.css`) para estilos, cuadrícula y estados visuales.
- **JavaScript (ES6+), sin frameworks ni dependencias externas**
  (`js/app.js`), para la lógica del tablero, los algoritmos y las
  animaciones.

Se eligió JavaScript vainilla porque el problema (grafo implícito sobre una
cuadrícula) no requiere un framework: reduce la complejidad, no necesita
compilación ni instalación de dependencias, y funciona igual en local que en
un hosting estático como Netlify.

## Instrucciones de uso

1. Abre `index.html` en un navegador. Recomendado: servirlo con un servidor
   local (por ejemplo `python -m http.server`) para evitar advertencias del
   navegador relacionadas con el protocolo `file://`; abrir el archivo
   directamente también funciona.
2. Elige una herramienta del panel izquierdo (Inicio, Meta, Obstáculo, Coste
   alto, Borrar) y haz clic en las celdas del tablero para editarlo.
3. Selecciona un algoritmo (BFS, DFS, UCS o A*) y pulsa **Ejecutar** para ver
   la exploración y la ruta encontrada.
4. Pulsa **Comparar todos** para ejecutar los cuatro algoritmos sobre el
   mismo mapa y ver pasos, coste y celdas exploradas de cada uno.
5. Usa **Limpiar ruta** para borrar solo la visualización, o **Reiniciar
   mapa** para vaciar el tablero.
6. Carga cualquiera de los cuatro escenarios predefinidos desde el panel
   "Escenarios".

## Algoritmos incluidos

- **BFS (anchura)**: cola FIFO, explora por niveles y garantiza el menor
  número de pasos en mapas sin pesos, pero ignora el coste de las celdas.
- **DFS (profundidad)**: pila LIFO, profundiza por una rama antes de
  retroceder; encuentra una ruta válida, no necesariamente la más corta ni
  la más barata.
- **UCS (coste uniforme)**: cola de prioridad ordenada por coste acumulado;
  garantiza el coste óptimo con costes no negativos.
- **A***: cola de prioridad ordenada por `coste acumulado + heurística`
  (distancia Manhattan a la meta más cercana); con una heurística admisible
  coincide con el coste óptimo de UCS explorando normalmente menos celdas.

Los cuatro algoritmos comparten el mismo modelo de movimiento ortogonal (sin
diagonales), el mismo coste de celda (1 por defecto, o el valor de la
baldosa ponderada) y la misma reconstrucción de ruta a partir de un mapa de
predecesores.

### Mejora adicional: búsqueda bidireccional

Se añade un quinto modo, seleccionable en el mismo desplegable y comparable
en "Comparar todos": dos BFS que avanzan a la vez, una desde el inicio y
otra desde todas las metas, expandiendo una capa de cada lado por turno
hasta que ambos frentes se tocan. El punto de encuentro se usa para unir la
mitad de ruta calculada desde el inicio (mapa de predecesores `forwardParent`)
con la mitad calculada desde las metas (`backwardParent`). Al explorar desde
ambos extremos a la vez, en mapas grandes visita menos celdas que un BFS
simple desde el inicio para llegar al mismo destino. Límite: al ser una
variante de BFS, no tiene en cuenta el coste de las baldosas ponderadas al
decidir qué frontera expandir (aunque el coste final de la ruta sí se
calcula y se muestra).

## Cuatro escenarios

| Escenario | Qué pone a prueba | Resultado esperado |
|---|---|---|
| 1 · Menos pasos | Desvíos y caminos de distinta longitud, sin pesos | BFS encuentra la ruta de pasos mínimos; DFS puede elegir una más larga |
| 2 · Atajo caro | Ruta corta con baldosas de coste alto frente a un rodeo barato | UCS y A* prefieren el menor coste; BFS puede preferir menos pasos |
| 3 · Varias metas | Meta cercana con penalización frente a otra más lejana y barata | UCS y A* justifican su elección por coste total; BFS prioriza pasos |
| 4 · Sin solución | Barrera de obstáculos que impide llegar a la meta | Los cuatro algoritmos terminan e informan que no existe ruta |

## Pruebas

Casos de prueba documentados en
[`docs/casos-de-prueba.md`](docs/casos-de-prueba.md): los cuatro escenarios
(con pasos, coste y celdas exploradas obtenidos), ruta simple, ausencia de
inicio o meta, varias metas, pesos, obstáculos, mapa sin solución y edición
del tablero tras ejecutar un algoritmo. Se confirma que UCS y A* coinciden en
el coste óptimo en los escenarios con pesos no negativos.

## Capturas

Las capturas de la aplicación y de los cuatro escenarios se incluyen en el
informe técnico y en `docs/capturas/`.

## Limitaciones

- Sin persistencia: el tablero se pierde al recargar la página.
- Sin simulación de ciudad (mejora opcional de la rúbrica, pendiente).
- La búsqueda bidireccional no considera el coste de las baldosas ponderadas
  al elegir qué frontera expandir.
- La heurística de A* asume movimiento ortogonal puro (Manhattan); no es
  válida si en el futuro se añaden diagonales.

## Estructura

- `index.html` → estructura principal
- `css/styles.css` → estilos
- `js/app.js` → tablero, escenarios y algoritmos
- `assets/` → recursos futuros
- `docs/` → documentación y capturas

## Enlaces

- Repositorio: https://github.com/aimardf/laboratorio-rutas-ra1
- Despliegue en Netlify: https://laberinto-aimar.netlify.app
- Informe técnico (PDF): se entrega junto al proyecto.