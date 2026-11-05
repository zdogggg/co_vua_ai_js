import { BENCHMARK_POSITIONS } from '../analysis/benchmark.js';
import { runBenchmarkAsync } from '../ai/ai-service.js';
import { buildExplanationTree, generateTreeSvg } from '../analysis/tree-visualizer.js';
import { CHECKMATE_SCORE } from '../ai/evaluation.js';
import { getPieceSvg } from '../chess/pieces.js';
import { GameMode } from './settings.js';

const ALGO_NAMES = { alphabeta: 'Alpha-Beta', minimax: 'Minimax' };

/**
 * Formats a centipawn score for display: "+1.25", "-0.40", or "M3" / "-M2" for a forced mate.
 * @param {number} score
 */
export function formatScore(score) {
  if (Math.abs(score) >= CHECKMATE_SCORE - 1000) {
    const plies = CHECKMATE_SCORE - Math.abs(score);
    const moves = Math.max(1, Math.ceil(plies / 2));
    return `${score > 0 ? '' : '-'}M${moves}`;
  }
  const pawns = score / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

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
    this.depthWarning = document.getElementById('depth-warning');
    this.moveOrderCheck = document.getElementById('check-move-ordering');

    // Buttons
    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnFlip = document.getElementById('btn-flip');
    this.btnPause = document.getElementById('btn-pause');

    // Board surroundings
    this.playerBars = {
      top: document.getElementById('player-bar-top'),
      bottom: document.getElementById('player-bar-bottom')
    };
    this.statusStrip = document.getElementById('status-strip');
    this.statusText = document.getElementById('status-text');
    this.evalBar = document.getElementById('eval-bar');
    this.evalFill = document.getElementById('eval-fill');
    this.evalLabel = document.getElementById('eval-label');

    // Game over overlay
    this.overlay = document.getElementById('game-over-overlay');
    this.overlayIcon = document.getElementById('game-over-icon');
    this.overlayTitle = document.getElementById('game-over-title');
    this.overlaySub = document.getElementById('game-over-sub');
    this.overlayDismissed = false;

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
      this.updateDepthWarning();
      this.gameController.render();
    });

    this.depthRange.addEventListener('input', (e) => {
      const depth = Number(e.target.value);
      this.depthDisplay.textContent = depth;
      this.settings.set('depth', depth);
      this.updateDepthWarning();
      this.gameController.render();
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

    this.btnPause.addEventListener('click', () => {
      this.gameController.togglePause();
    });

    document.getElementById('btn-overlay-new').addEventListener('click', () => {
      this.gameController.startNewGame();
    });

    document.getElementById('btn-overlay-close').addEventListener('click', () => {
      this.overlayDismissed = true;
      this.overlay.classList.add('hidden');
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

  updateDepthWarning() {
    const heavy = this.settings.get('algorithm') === 'minimax' && Number(this.settings.get('depth')) >= 4;
    this.depthWarning.classList.toggle('hidden', !heavy);
  }

  renderSearchTree() {
    if (!this.treeContainer) return;

    this.treeContainer.innerHTML = `<div class="history-empty">Đang phân tích và dựng sơ đồ cây cắt tỉa Alpha-Beta...</div>`;

    setTimeout(() => {
      const data = buildExplanationTree(this.gameController.chess);
      const svgHtml = generateTreeSvg(data.root);

      let tableHtml = `
        <div class="trace-table-container">
          <div class="trace-title">BẢNG TRUY VẾT QUYẾT ĐỊNH & CẮT TỈA TỪNG BƯỚC</div>
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
            <td class="trace-note">${row.note}</td>
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

  /**
   * Describes who controls a color in the current mode.
   * @returns {{ name: string, isAi: boolean }}
   */
  describeSide(color, state) {
    const colorName = color === 'w' ? 'Trắng' : 'Đen';
    const aiName = `AI ${ALGO_NAMES[this.settings.get('algorithm')]} · độ sâu ${this.settings.get('depth')}`;

    if (state.mode === GameMode.AI_VS_AI) {
      return { name: `${aiName} (${colorName})`, isAi: true };
    }
    if (state.mode === GameMode.PLAYER_VS_PLAYER) {
      return { name: `Người chơi ${colorName}`, isAi: false };
    }
    return color === state.playerColor
      ? { name: `Bạn (${colorName})`, isAi: false }
      : { name: `${aiName} (${colorName})`, isAi: true };
  }

  renderPlayerBar(barEl, color, state) {
    const side = this.describeSide(color, state);
    const isTurn = !state.status.isGameOver && state.turn === color;

    barEl.classList.toggle('active', isTurn);
    barEl.querySelector('[data-role="avatar"]').textContent = side.isAi ? '🤖' : '👤';
    barEl.querySelector('[data-role="indicator"]').className = `player-indicator ${color === 'w' ? 'white' : 'black'}`;
    barEl.querySelector('[data-role="name"]').textContent = side.name;

    // Pieces this side has captured = pieces the opponent lost
    const opponent = color === 'w' ? 'b' : 'w';
    const diff = color === 'w' ? state.captured.materialDiff : -state.captured.materialDiff;
    let html = state.captured.lost[opponent]
      .map(type => `<span class="captured-piece">${getPieceSvg({ type, color: opponent })}</span>`)
      .join('');
    if (diff > 0) html += `<span class="material-diff">+${diff}</span>`;
    barEl.querySelector('[data-role="captured"]').innerHTML = html;

    const turnEl = barEl.querySelector('[data-role="turn"]');
    if (isTurn && state.isAiThinking) {
      turnEl.innerHTML = `<span class="spinner"></span>Đang nghĩ`;
    } else if (isTurn && state.isPaused) {
      turnEl.textContent = 'Tạm dừng';
    } else if (isTurn) {
      turnEl.textContent = side.isAi ? 'Lượt AI' : 'Đến lượt';
    } else {
      turnEl.textContent = '';
    }
  }

  updateState(state) {
    const { status, isAiThinking } = state;

    // Bottom bar belongs to whichever color sits at the bottom of the board
    const bottomColor = state.flipped ? 'b' : 'w';
    const topColor = bottomColor === 'w' ? 'b' : 'w';
    this.renderPlayerBar(this.playerBars.top, topColor, state);
    this.renderPlayerBar(this.playerBars.bottom, bottomColor, state);

    // Status strip
    let tone = status.type;
    let text = status.message;
    if (isAiThinking) {
      tone = 'thinking';
      text = 'AI đang tính toán nước đi...';
    } else if (state.isPaused && !status.isGameOver) {
      tone = 'paused';
      text = 'Ván AI vs AI đang tạm dừng';
    }
    this.statusStrip.dataset.tone = tone;
    this.statusText.textContent = text;

    // Evaluation bar: squash the score into White's share of the bar (0-100%)
    const score = state.evalScore;
    const whitePct = Math.abs(score) >= CHECKMATE_SCORE - 1000
      ? (score > 0 ? 100 : 0)
      : 50 + 50 * Math.tanh(score / 600);
    this.evalFill.style.height = `${whitePct}%`;
    this.evalBar.classList.toggle('flipped', state.flipped);
    this.evalLabel.textContent = formatScore(score);
    this.evalLabel.classList.toggle('on-white', whitePct >= 50);

    // Controls
    this.btnUndo.disabled = !state.canUndo;
    this.colorSelect.disabled = state.mode !== GameMode.PLAYER_VS_AI;
    const isAiVsAi = state.mode === GameMode.AI_VS_AI;
    this.btnPause.classList.toggle('hidden', !isAiVsAi || status.isGameOver);
    this.btnPause.querySelector('span').textContent = state.isPaused ? 'Tiếp tục' : 'Tạm dừng';

    // Game over overlay (shown once per finished game, until dismissed)
    if (status.isGameOver) {
      if (!this.overlayDismissed) {
        const isMate = status.type === 'checkmate';
        this.overlayIcon.textContent = isMate ? '🏆' : '🤝';
        this.overlayTitle.textContent = isMate ? 'Chiếu hết!' : 'Hòa cờ';
        this.overlaySub.textContent = status.message.replace(/^(Chiếu hết! |Hòa cờ: )/, '').replace(' 🏆', '');
        this.overlay.classList.remove('hidden');
      }
    } else {
      this.overlayDismissed = false;
      this.overlay.classList.add('hidden');
    }

    if (this.thinkingBanner) {
      this.thinkingBanner.classList.toggle('hidden', !isAiThinking);
    }
  }

  updateMetrics(data) {
    if (this.metricAlgo) this.metricAlgo.textContent = ALGO_NAMES[data.algorithm];
    if (this.metricDepth) this.metricDepth.textContent = data.depth;
    if (this.metricMove) this.metricMove.textContent = data.bestMove;
    if (this.metricScore) this.metricScore.textContent = formatScore(data.score);
    if (this.metricNodes) this.metricNodes.textContent = data.nodes.toLocaleString();
    if (this.metricCutoffs) this.metricCutoffs.textContent = data.cutoffs.toLocaleString();
    if (this.metricPruned) this.metricPruned.textContent = data.branchesPruned.toLocaleString();
    if (this.metricTime) this.metricTime.textContent = `${data.timeMs} ms`;
    if (this.metricNps) this.metricNps.textContent = `${data.nps.toLocaleString()} nps`;
  }

  async executeBenchmarkSuite() {
    this.btnRunBenchmark.disabled = true;
    this.benchmarkResults.innerHTML = '';

    for (let i = 0; i < BENCHMARK_POSITIONS.length; i++) {
      const pos = BENCHMARK_POSITIONS[i];
      this.btnRunBenchmark.textContent = `Đang chạy ${i + 1}/${BENCHMARK_POSITIONS.length}...`;

      const depth = pos.recommendedDepth;
      const res = await runBenchmarkAsync(pos.fen, depth, true);
      const abPct = res.minimax.nodes > 0 ? (res.alphaBeta.nodes / res.minimax.nodes) * 100 : 100;

      this.benchmarkResults.insertAdjacentHTML('beforeend', `
        <div class="benchmark-card">
          <div class="benchmark-card-header">
            <span class="benchmark-pos-name">${pos.name}</span>
            <span class="savings-tag">Tiết kiệm ${res.savingsPercent}% node</span>
          </div>
          <div class="benchmark-meta">Độ sâu ${depth} · nhanh hơn ×${res.speedup}</div>
          <div class="node-bars">
            <div class="node-bar-row">
              <span class="node-bar-label">Minimax</span>
              <div class="node-bar-track"><div class="node-bar minimax" style="width:100%"></div></div>
              <span class="node-bar-value">${res.minimax.nodes.toLocaleString()}</span>
            </div>
            <div class="node-bar-row">
              <span class="node-bar-label">Alpha-Beta</span>
              <div class="node-bar-track"><div class="node-bar alphabeta" style="width:${Math.max(abPct, 0.5)}%"></div></div>
              <span class="node-bar-value">${res.alphaBeta.nodes.toLocaleString()}</span>
            </div>
          </div>
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
                <td>${formatScore(res.minimax.score)}</td>
                <td>${res.minimax.nodes.toLocaleString()}</td>
                <td>${res.minimax.timeMs} ms</td>
              </tr>
              <tr class="row-alphabeta">
                <td>Alpha-Beta</td>
                <td><b>${res.alphaBeta.bestMove}</b></td>
                <td>${formatScore(res.alphaBeta.score)}</td>
                <td>${res.alphaBeta.nodes.toLocaleString()} (cắt: ${res.alphaBeta.cutoffs})</td>
                <td>${res.alphaBeta.timeMs} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      `);
    }

    this.btnRunBenchmark.disabled = false;
    this.btnRunBenchmark.textContent = 'Chạy lại Benchmark';
  }
}
