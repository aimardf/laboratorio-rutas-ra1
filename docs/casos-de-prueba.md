# Casos de prueba

Verificación de los cuatro escenarios y de los casos obligatorios de la rúbrica.
Los resultados de "resultado obtenido" se generaron ejecutando `bfs()`, `dfs()`,
`ucs()`, `astar()` y `bidirectional()` de [`js/app.js`](../js/app.js) sobre cada
escenario cargado con `loadScenario(id)`.

## Cuatro escenarios de la maqueta

### 1 · Menos pasos

- **Entrada**: escenario 1 (inicio `10,2`, meta `10,17`, sin pesos, muro en
  fila 10 y muro vertical en columna 8 con una única abertura en `8,8`).
- **Resultado esperado**: BFS encuentra la ruta de menos pasos; DFS puede
  elegir una ruta más larga.
- **Resultado obtenido**:

  | Algoritmo | Pasos | Coste | Exploradas |
  |---|---|---|---|
  | BFS | 19 | 19 | 300 |
  | DFS | 23 | 23 | 335 |
  | UCS | 19 | 19 | 300 |
  | A* | 19 | 19 | 53 |
  | Bidireccional | 19 | 19 | 249 |

  BFS logra el mínimo de pasos (19) y DFS es más largo (23), tal como se
  esperaba. Al no haber pesos, coste = pasos en todos los algoritmos.
- **Captura**: `docs/capturas/escenario-1.png` (pendiente de añadir).

### 2 · Atajo caro

- **Entrada**: escenario 2 (inicio `10,2`, meta `10,17`, fila 10 con coste 8
  entre columnas 5 y 14, y dos muros paralelos con huecos que obligan a
  rodear).
- **Resultado esperado**: UCS y A* prefieren el rodeo más barato; BFS puede
  preferir el atajo con menos pasos aunque sea más caro.
- **Resultado obtenido**:

  | Algoritmo | Pasos | Coste | Exploradas |
  |---|---|---|---|
  | BFS | 15 | 85 | 240 |
  | DFS | 21 | 21 | 300 |
  | UCS | 17 | 17 | 264 |
  | A* | 17 | 17 | 39 |
  | Bidireccional | 15 | 85 | 181 |

  BFS atraviesa el atajo caro (15 pasos, coste 85). UCS y A* rodean por la
  ruta barata y **coinciden en el coste óptimo (17)**, confirmando que ambos
  garantizan el coste mínimo con pesos no negativos.
- **Captura**: `docs/capturas/escenario-2.png` (pendiente de añadir).

### 3 · Varias metas

- **Entrada**: escenario 3 (inicio `10,2`, meta cercana `8,10` con
  penalización de coste 15, meta lejana `15,17` sin penalización).
- **Resultado esperado**: UCS y A* justifican su elección por coste total
  (meta lejana más barata); BFS prioriza pasos (meta cercana).
- **Resultado obtenido**:

  | Algoritmo | Meta elegida | Pasos | Coste | Exploradas |
  |---|---|---|---|---|
  | BFS | `8,10` | 10 | 24 | 142 |
  | DFS | `8,10` | 20 | 34 | 203 |
  | UCS | `15,17` | 20 | 20 | 338 |
  | A* | `15,17` | 20 | 20 | 190 |
  | Bidireccional | `8,10` | 10 | 24 | 136 |

  BFS elige la meta cercana pero penalizada (coste 24). UCS y A* eligen la
  meta lejana y **coinciden en el coste óptimo (20)**, menor que el de BFS.
- **Captura**: `docs/capturas/escenario-3.png` (pendiente de añadir).

### 4 · Sin solución

- **Entrada**: escenario 4 (inicio `10,3`, meta `10,16`, columna 10 totalmente
  amurallada de borde a borde).
- **Resultado esperado**: los cuatro algoritmos (y la mejora bidireccional)
  terminan e informan que no existe ruta.
- **Resultado obtenido**: BFS, DFS, UCS, A* y Bidireccional devuelven
  `found = false` tras explorar todo el lado alcanzable del tablero (200
  celdas por BFS/DFS/UCS/A*, 378 combinando ambos frentes en Bidireccional).
  La interfaz debe mostrar "Sin solución" y las celdas exploradas.
- **Captura**: `docs/capturas/escenario-4.png` (pendiente de añadir).

## Casos de prueba obligatorios adicionales

| Caso | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Ruta simple | Escenario 1, algoritmo BFS | Encuentra ruta, muestra pasos/coste/exploradas | Ruta de 19 pasos, coste 19 (ver tabla escenario 1) |
| Ausencia de inicio | Tablero sin celda de inicio definida, pulsar "Ejecutar" | `validate()` bloquea la ejecución y `status` muestra "Falta inicio" | Confirmado por lectura de código: `validate()` devuelve `false` si `!start` antes de llamar a `runAlgorithm` |
| Ausencia de meta | Tablero con inicio pero sin metas, pulsar "Ejecutar" | `validate()` bloquea la ejecución y `status` muestra "Falta meta" | Confirmado: `validate()` devuelve `false` si `goals.size === 0` |
| Varias metas | Escenario 3 | Se alcanza y compara el coste de más de una meta | Ver tabla escenario 3: BFS llega a `8,10`, UCS/A* a `15,17` |
| Pesos | Escenario 2 | El coste refleja las baldosas ponderadas (valor > 1) | Coste 85 (BFS) vs 17 (UCS/A*) en escenario 2 |
| Obstáculos | Escenarios 1, 2 y 4 | `neighbors()` nunca devuelve una celda muro | Confirmado por código: `neighbors()` filtra `walls.has(nk)` |
| Mapa sin solución | Escenario 4 | Los algoritmos terminan (no cuelgan) e informan "Sin solución" | Ver tabla escenario 4: los 5 algoritmos devuelven `found=false` |
| Edición tras ejecutar | Ejecutar un algoritmo y luego hacer clic en una celda | El tablero se puede seguir editando y se limpia la visualización previa | Confirmado por código: `handleCellClick()` llama a `clearSearchVisuals()` y `renderGrid()` en cada clic, independientemente de si ya se había ejecutado un algoritmo |

## Coincidencia de UCS y A* en coste óptimo

En los dos escenarios con pesos no negativos (2 y 3), UCS y A* obtuvieron
exactamente el mismo coste (17 y 20 respectivamente), lo que confirma que
ambos algoritmos garantizan el coste óptimo cuando los costes son no
negativos.
