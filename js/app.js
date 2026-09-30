const ROWS = 20;
const COLS = 20;

const gridEl = document.getElementById("grid");
const algorithmEl = document.getElementById("algorithm");
const runBtn = document.getElementById("runBtn");
const compareBtn = document.getElementById("compareBtn");
const clearPathBtn = document.getElementById("clearPathBtn");
const resetBtn = document.getElementById("resetBtn");

const statusEl = document.getElementById("status");
const stepsEl = document.getElementById("steps");
const costEl = document.getElementById("cost");
const exploredEl = document.getElementById("explored");
const comparisonEl = document.getElementById("comparison");
const speedEl = document.getElementById("speed");
const pauseBtn = document.getElementById("pauseBtn");

let currentTool = "start";
let isPaused = false;
let isAnimating = false;
let start = null;
let goals = new Set();
let walls = new Set();
let weights = new Map();

const key = (r, c) => `${r},${c}`;
const parseKey = (k) => k.split(",").map(Number);

function createGrid() {
  gridEl.innerHTML = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", () => handleCellClick(r, c));
      gridEl.appendChild(cell);
    }
  }

  renderGrid();
}

function handleCellClick(r, c) {
  const k = key(r, c);

  if (currentTool === "start") {
    if (walls.has(k) || goals.has(k)) return;
    start = k;
  }

  if (currentTool === "goal") {
    if (walls.has(k) || start === k) return;
    goals.add(k);
  }

  if (currentTool === "wall") {
    if (start === k || goals.has(k)) return;
    weights.delete(k);
    walls.add(k);
  }

  if (currentTool === "weight") {
    if (start === k || goals.has(k) || walls.has(k)) return;
    weights.set(k, 5);
  }

  if (currentTool === "erase") {
    if (start === k) start = null;
    goals.delete(k);
    walls.delete(k);
    weights.delete(k);
  }

  clearSearchVisuals();
  renderGrid();
}

function renderGrid() {
  [...gridEl.children].forEach(cell => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const k = key(r, c);

    cell.className = "cell";
    cell.textContent = "";

    if (walls.has(k)) cell.classList.add("wall");
    if (weights.has(k)) {
      cell.classList.add("weight");
      cell.textContent = weights.get(k);
    }
    if (start === k) {
      cell.classList.add("start");
      cell.textContent = "S";
    }
    if (goals.has(k)) {
      cell.classList.add("goal");
      cell.textContent = "G";
    }
  });
}

function clearSearchVisuals() {
  [...gridEl.children].forEach(cell => {
    cell.classList.remove("visited", "path");
  });
  statusEl.textContent = "Preparado";
  stepsEl.textContent = "0";
  costEl.textContent = "0";
  exploredEl.textContent = "0";
}

function resetMap() {
  start = null;
  goals = new Set();
  walls = new Set();
  weights = new Map();
  comparisonEl.className = "comparison-empty";
  comparisonEl.innerHTML = 'Ejecuta “Comparar todos” para ver BFS, DFS, UCS y A*.';
  clearSearchVisuals();
  renderGrid();
}

function neighbors(k) {
  const [r, c] = parseKey(k);
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const result = [];

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;

    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const nk = key(nr, nc);
      if (!walls.has(nk)) result.push(nk);
    }
  }

  return result;
}

function moveCost(k) {
  return weights.get(k) ?? 1;
}

function heuristic(k) {
  const [r, c] = parseKey(k);
  let best = Infinity;

  for (const g of goals) {
    const [gr, gc] = parseKey(g);
    const d = Math.abs(r - gr) + Math.abs(c - gc);
    if (d < best) best = d;
  }

  return best;
}

function reconstructPath(parent, end) {
  const path = [end];
  let current = end;

  while (parent.has(current)) {
    current = parent.get(current);
    path.push(current);
  }

  return path.reverse();
}

function bfs() {
  const queue = [start];
  const visited = new Set([start]);
  const parent = new Map();
  const order = [];

  while (queue.length) {
    const current = queue.shift();
    order.push(current);

    if (goals.has(current)) {
      const path = reconstructPath(parent, current);
      return buildResult(path, order, current);
    }

    for (const next of neighbors(current)) {
      if (!visited.has(next)) {
        visited.add(next);
        parent.set(next, current);
        queue.push(next);
      }
    }
  }

  return noSolution(order);
}

function dfs() {
  const stack = [start];
  const visited = new Set();
  const parent = new Map();
  const order = [];

  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current)) continue;

    visited.add(current);
    order.push(current);

    if (goals.has(current)) {
      const path = reconstructPath(parent, current);
      return buildResult(path, order, current);
    }

    const ns = neighbors(current).reverse();
    for (const next of ns) {
      if (!visited.has(next)) {
        if (!parent.has(next)) parent.set(next, current);
        stack.push(next);
      }
    }
  }

  return noSolution(order);
}

function ucs() {
  const frontier = [{ node: start, priority: 0 }];
  const dist = new Map([[start, 0]]);
  const parent = new Map();
  const visited = new Set();
  const order = [];

  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority);
    const { node: current } = frontier.shift();

    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);

    if (goals.has(current)) {
      const path = reconstructPath(parent, current);
      return buildResult(path, order, current, dist.get(current));
    }

    for (const next of neighbors(current)) {
      const newCost = dist.get(current) + moveCost(next);

      if (!dist.has(next) || newCost < dist.get(next)) {
        dist.set(next, newCost);
        parent.set(next, current);
        frontier.push({ node: next, priority: newCost });
      }
    }
  }

  return noSolution(order);
}

function astar() {
  const frontier = [{ node: start, priority: heuristic(start) }];
  const gScore = new Map([[start, 0]]);
  const parent = new Map();
  const visited = new Set();
  const order = [];

  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority);
    const { node: current } = frontier.shift();

    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);

    if (goals.has(current)) {
      const path = reconstructPath(parent, current);
      return buildResult(path, order, current, gScore.get(current));
    }

    for (const next of neighbors(current)) {
      const tentative = gScore.get(current) + moveCost(next);

      if (!gScore.has(next) || tentative < gScore.get(next)) {
        gScore.set(next, tentative);
        parent.set(next, current);
        frontier.push({
          node: next,
          priority: tentative + heuristic(next)
        });
      }
    }
  }

  return noSolution(order);
}

// Búsqueda bidireccional: dos BFS a la vez (desde el inicio y desde las metas) hasta que se encuentran.
function bidirectional() {
  const forwardParent = new Map();
  const backwardParent = new Map();
  const visitedF = new Set([start]);
  const visitedB = new Set(goals);
  let frontierF = [start];
  let frontierB = [...goals];
  const order = [];

  const expandLayer = (frontier, visitedSelf, visitedOther, parentMap) => {
    const nextFrontier = [];

    for (const node of frontier) {
      for (const next of neighbors(node)) {
        if (visitedSelf.has(next)) continue;

        visitedSelf.add(next);
        parentMap.set(next, node);
        order.push(next);
        nextFrontier.push(next);

        if (visitedOther.has(next)) return { meet: next, nextFrontier };
      }
    }

    return { meet: null, nextFrontier };
  };

  let meet = null;

  while (frontierF.length && frontierB.length && !meet) {
    const forwardStep = expandLayer(frontierF, visitedF, visitedB, forwardParent);
    frontierF = forwardStep.nextFrontier;
    if (forwardStep.meet) {
      meet = forwardStep.meet;
      break;
    }

    const backwardStep = expandLayer(frontierB, visitedB, visitedF, backwardParent);
    frontierB = backwardStep.nextFrontier;
    if (backwardStep.meet) meet = backwardStep.meet;
  }

  if (!meet) return noSolution(order);

  const path = reconstructPath(forwardParent, meet);
  let cur = backwardParent.get(meet);
  while (cur !== undefined) {
    path.push(cur);
    cur = backwardParent.get(cur);
  }

  return buildResult(path, order, path[path.length - 1]);
}

function buildResult(path, order, goalNode, forcedCost = null) {
  let cost = forcedCost;

  if (cost === null) {
    cost = 0;
    for (let i = 1; i < path.length; i++) {
      cost += moveCost(path[i]);
    }
  }

  return {
    found: true,
    path,
    exploredOrder: order,
    steps: path.length - 1,
    cost,
    goal: goalNode
  };
}

function noSolution(order) {
  return {
    found: false,
    path: [],
    exploredOrder: order,
    steps: 0,
    cost: 0,
    goal: null
  };
}

function validate() {
  if (!start) {
    statusEl.textContent = "Falta inicio";
    return false;
  }

  if (goals.size === 0) {
    statusEl.textContent = "Falta meta";
    return false;
  }

  return true;
}

function runAlgorithm(name) {
  if (name === "bfs") return bfs();
  if (name === "dfs") return dfs();
  if (name === "ucs") return ucs();
  if (name === "astar") return astar();
  if (name === "bidirectional") return bidirectional();
}

async function animateResult(result) {
  clearSearchVisuals();
  setAnimating(true);

  for (const k of result.exploredOrder) {
    if (k !== start && !goals.has(k)) {
      const [r, c] = parseKey(k);
      const cell = getCell(r, c);
      cell.classList.add("visited");
      await waitWhilePaused();
      await sleep(8);
    }
  }

  if (!result.found) {
    statusEl.textContent = "Sin solución";
    exploredEl.textContent = result.exploredOrder.length;
    setAnimating(false);
    return;
  }

  for (const k of result.path) {
    if (k !== start && !goals.has(k)) {
      const [r, c] = parseKey(k);
      getCell(r, c).classList.add("path");
      await waitWhilePaused();
      await sleep(18);
    }
  }

  statusEl.textContent = "Ruta encontrada";
  stepsEl.textContent = result.steps;
  costEl.textContent = result.cost;
  exploredEl.textContent = result.exploredOrder.length;
  setAnimating(false);
}

function getCell(r, c) {
  return gridEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function speedFactor() {
  // slider 1 (lento) .. 5 (rápido) -> factor de escala del retardo base
  return (6 - Number(speedEl.value)) / 3;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms * speedFactor()));
}

function waitWhilePaused() {
  return new Promise(resolve => {
    const check = () => {
      if (!isPaused) return resolve();
      setTimeout(check, 100);
    };
    check();
  });
}

function setAnimating(active) {
  isAnimating = active;
  pauseBtn.disabled = !active;
  if (!active) {
    isPaused = false;
    pauseBtn.textContent = "⏸ Pausar";
  }
}

pauseBtn.addEventListener("click", () => {
  if (!isAnimating) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶ Reanudar" : "⏸ Pausar";
});

runBtn.addEventListener("click", async () => {
  if (!validate() || isAnimating) return;
  const result = runAlgorithm(algorithmEl.value);
  await animateResult(result);
});

compareBtn.addEventListener("click", () => {
  if (!validate()) return;

  const names = [
    ["BFS", "bfs"],
    ["DFS", "dfs"],
    ["UCS", "ucs"],
    ["A*", "astar"],
    ["Bidireccional", "bidirectional"]
  ];

  const rows = names.map(([label, code]) => {
    const r = runAlgorithm(code);

    return `
      <tr>
        <td>${label}</td>
        <td>${r.found ? r.steps : "-"}</td>
        <td>${r.found ? r.cost : "-"}</td>
        <td>${r.exploredOrder.length}</td>
      </tr>
    `;
  }).join("");

  comparisonEl.className = "";
  comparisonEl.innerHTML = `
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Alg.</th>
          <th>Pasos</th>
          <th>Coste</th>
          <th>Exp.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
});

clearPathBtn.addEventListener("click", () => {
  clearSearchVisuals();
  renderGrid();
});

resetBtn.addEventListener("click", resetMap);

document.querySelectorAll(".tool").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTool = btn.dataset.tool;
  });
});

document.querySelectorAll(".scenario-btn").forEach(btn => {
  btn.addEventListener("click", () => loadScenario(btn.dataset.scenario));
});

function loadScenario(id) {
  resetMap();

  if (id === "1") {
    start = key(10, 2);
    goals.add(key(10, 17));

    for (let c = 5; c <= 14; c++) walls.add(key(10, c));
    for (let r = 7; r <= 13; r++) {
      if (r !== 8) walls.add(key(r, 8));
    }
  }

  if (id === "2") {
    start = key(10, 2);
    goals.add(key(10, 17));

    for (let c = 5; c <= 14; c++) {
      weights.set(key(10, c), 8);
    }

    for (let c = 4; c <= 15; c++) {
      walls.add(key(8, c));
      walls.add(key(12, c));
    }

    walls.delete(key(8, 4));
    walls.delete(key(8, 15));
    walls.delete(key(12, 4));
    walls.delete(key(12, 15));
  }

  if (id === "3") {
    start = key(10, 2);
    goals.add(key(8, 10));
    goals.add(key(15, 17));

    weights.set(key(8, 10), 15);

    for (let r = 6; r <= 14; r++) {
      if (r !== 10) walls.add(key(r, 7));
    }
  }

  if (id === "4") {
    start = key(10, 3);
    goals.add(key(10, 16));

    for (let r = 0; r < ROWS; r++) {
      walls.add(key(r, 10));
    }
  }

  renderGrid();
}

createGrid();
loadScenario("1");
