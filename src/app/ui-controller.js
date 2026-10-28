import { BENCHMARK_POSITIONS, runBenchmarkComparison } from '../analysis/benchmark.js';
import { buildExplanationTree, generateTreeSvg } from '../analysis/tree-visualizer.js';

export class UIController {
  constructor({ settings, gameController }) {
    this.settings = settings;
    this.gameController = gameController;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Tabs
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Controls
    this.modeSelect = document.getElementById('select-game-mode');
    this.colorSelect = document.getElementById('select-player-color');
    this.algoSelect = document.getElementById('select-algorithm');
    this.depthRange = document.getElementById('range-depth');
    this.depthDisplay = document.getElementById('display-depth');
    this.moveOrderCheck = document.getElementById('check-move-ordering');

    // Buttons
    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnFlip = document.getElementById('btn-flip');

    // Game Status Badges
    this.statusBadgeTop = document.getElementById('status-badge-top');
    this.statusBadgeBottom = document.getElementById('status-badge-bottom');

    // Metrics elements
    this.metricAlgo = document.getElementById('metric-algo');
    this.metricDepth = document.getElementById('metric-depth');
    this.metricMove = document.getElementById('metric-move');
    this.metricScore = document.getElementById('metric-score');
    this.metricNodes = document.getElementById('metric-nodes');
    this.metricCutoffs = document.getElementById('metric-cutoffs');
    this.metricPruned = document.getElementById('metric-pruned');
    this.metricTime = document.getElementById('metric-time');
    this.metricNps = document.getElementById('metric-nps');
    this.thinkingBanner = document.getElementById('thinking-banner');

    // Benchmark elements
    this.btnRunBenchmark = document.getElementById('btn-run-benchmark');
    this.benchmarkResults = document.getElementById('benchmark-results');

    // Tree Visualizer
    this.btnRenderTree = document.getElementById('btn-render-tree');
    this.treeContainer = document.getElementById('tree-visual-container');
  }

  bindEvents() {
    // Tab switching
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.tabButtons.forEach(b => b.classList.remove('active'));
        this.tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.add('active');
      });
    });

    // Settings changes
    this.modeSelect.addEventListener('change', (e) => {
      this.settings.set('gameMode', e.target.value);
      this.gameController.startNewGame();
    });

    this.colorSelect.addEventListener('change', (e) => {
      const color = e.target.value;
      this.settings.set('playerColor', color);
      // Auto-flip board to match player perspective
      this.settings.set('isBoardFlipped', color === 'b');
      this.gameController.startNewGame();
    });

    this.algoSelect.addEventListener('change', (e) => {
      this.settings.set('algorithm', e.target.value);
    });

    this.depthRange.addEventListener('input', (e) => {
      const depth = Number(e.target.value);
      this.depthDisplay.textContent = depth;
      this.settings.set('depth', depth);
    });

    this.moveOrderCheck.addEventListener('change', (e) => {
      this.settings.set('useMoveOrdering', e.target.checked);
    });

    // Buttons
    this.btnNewGame.addEventListener('click', () => {
      this.gameController.startNewGame();
    });

    this.btnUndo.addEventListener('click', () => {
      this.gameController.undo();
    });

    this.btnFlip.addEventListener('click', () => {
      this.gameController.flipBoard();
    });

    // Benchmark
    this.btnRunBenchmark.addEventListener('click', () => {
      this.executeBenchmarkSuite();
    });

    // Search Tree Visualizer
    if (this.btnRenderTree) {
      this.btnRenderTree.addEventListener('click', () => {
        this.renderSearchTree();
      });
    }
  }

  renderSearchTree() {
    if (!this.treeContainer) return;

    this.treeContainer.innerHTML = `<div class="history-empty">Đang phân tích và dựng sơ đồ cây cắt tỉa Alpha-Beta...</div>`;

    setTimeout(() => {
      const data = buildExplanationTree(this.gameController.chess);
      const svgHtml = generateTreeSvg(data.root);

      let tableHtml = `
        <div class="trace-table-container">
          <div style="font-weight:700; font-size:0.85rem; margin-bottom:0.4rem; color:var(--text-muted);">
            BẢNG TRUY VẾT QUYẾT ĐỊNH & CẮT TỈA TỪNG BƯỚC
          </div>
          <table class="trace-table">
            <thead>
              <tr>
                <th>Nước đi</th>
                <th>Tầng</th>
                <th>α</th>
                <th>β</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const row of data.tableRows) {
        const isPruned = row.status.includes('CẮT TỈA');
        const isBest = row.status.includes('Nước tốt nhất');
        const rowClass = isPruned ? 'row-pruned' : (isBest ? 'row-best' : '');

        tableHtml += `
          <tr class="${rowClass}">
            <td><b>${row.move}</b></td>
            <td>${row.role}</td>
            <td>${row.alpha}</td>
            <td>${row.beta}</td>
            <td>${row.score}</td>
            <td>${row.status}</td>
            <td style="font-size:0.75rem; opacity:0.85;">${row.note}</td>
          </tr>
        `;
      }

      tableHtml += `</tbody></table></div>`;

      this.treeContainer.innerHTML = `
        <div class="tree-svg-wrapper">
          ${svgHtml}
        </div>
        ${tableHtml}
      `;
    }, 50);
  }

  updateStatus(status, isAiThinking) {
    if (this.statusBadgeTop) {
      if (isAiThinking) {
        this.statusBadgeTop.className = 'status-badge badge-warning';
        this.statusBadgeTop.textContent = 'AI đang tính toán nước đi...';
      } else {
        this.statusBadgeTop.className = `status-badge ${status.badgeClass}`;
        this.statusBadgeTop.textContent = status.message;
      }
    }

    if (this.thinkingBanner) {
      if (isAiThinking) {
        this.thinkingBanner.classList.remove('hidden');
      } else {
        this.thinkingBanner.classList.add('hidden');
      }
    }
  }

  updateMetrics(data) {
    if (this.metricAlgo) this.metricAlgo.textContent = data.algorithm === 'alphabeta' ? 'Alpha-Beta' : 'Minimax';
    if (this.metricDepth) this.metricDepth.textContent = data.depth;
    if (this.metricMove) this.metricMove.textContent = data.bestMove;
    if (this.metricScore) {
      const scoreStr = (data.score / 100).toFixed(2);
      this.metricScore.textContent = `${scoreStr > 0 ? '+' : ''}${scoreStr}`;
    }
    if (this.metricNodes) this.metricNodes.textContent = data.nodes.toLocaleString();
    if (this.metricCutoffs) this.metricCutoffs.textContent = data.cutoffs.toLocaleString();
    if (this.metricPruned) this.metricPruned.textContent = data.branchesPruned.toLocaleString();
    if (this.metricTime) this.metricTime.textContent = `${data.timeMs} ms`;
    if (this.metricNps) this.metricNps.textContent = `${data.nps.toLocaleString()} nps`;
  }

  async executeBenchmarkSuite() {
    this.btnRunBenchmark.disabled = true;
    this.btnRunBenchmark.textContent = 'Đang chạy benchmark...';
    this.benchmarkResults.innerHTML = `<div class="history-empty">Đang tiến hành đo lường thực tế Minimax và Alpha-Beta trên các vị trí...</div>`;

    // Yield control briefly so UI updates
    await new Promise(r => setTimeout(r, 50));

    let html = '';

    for (const pos of BENCHMARK_POSITIONS) {
      const depth = pos.recommendedDepth;
      const res = runBenchmarkComparison(pos.fen, depth, true);

      html += `
        <div class="benchmark-card">
          <div class="benchmark-card-header">
            <span class="benchmark-pos-name">${pos.name}</span>
            <span class="savings-tag">Tiết kiệm ${res.savingsPercent}% node</span>
          </div>
          <div style="font-size:0.75rem; color: var(--text-muted); font-family: monospace;">Độ sâu: ${depth}</div>
          <table class="benchmark-table">
            <thead>
              <tr>
                <th>Thuật toán</th>
                <th>Nước đi</th>
                <th>Điểm</th>
                <th>Số node</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Minimax</td>
                <td><b>${res.minimax.bestMove}</b></td>
                <td>${(res.minimax.score / 100).toFixed(2)}</td>
                <td>${res.minimax.nodes.toLocaleString()}</td>
                <td>${res.minimax.timeMs} ms</td>
              </tr>
              <tr style="color: var(--primary);">
                <td>Alpha-Beta</td>
                <td><b>${res.alphaBeta.bestMove}</b></td>
                <td>${(res.alphaBeta.score / 100).toFixed(2)}</td>
                <td>${res.alphaBeta.nodes.toLocaleString()} (cắt: ${res.alphaBeta.cutoffs})</td>
                <td>${res.alphaBeta.timeMs} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    this.benchmarkResults.innerHTML = html;
    this.btnRunBenchmark.disabled = false;
    this.btnRunBenchmark.textContent = 'Chạy Benchmark Đối Chiếu';
  }
}
