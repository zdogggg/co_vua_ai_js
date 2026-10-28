import { evaluatePosition } from '../ai/evaluation.js';
import { orderMoves } from '../ai/move-ordering.js';

/**
 * Builds an academic, presentation-grade explanation tree for Alpha-Beta pruning.
 * Limits depth to 2 and candidate moves to top 3-4 to keep diagrams legible and clear.
 * 
 * @param {import('chess.js').Chess} chess
 * @returns {object} Tree data structure with nodes, cutoffs, and decision table
 */
export function buildExplanationTree(chess) {
  const isMaximizing = chess.turn() === 'w';
  const tableRows = [];

  const root = {
    id: 'root',
    name: 'Gốc (Bàn cờ hiện tại)',
    move: chess.turn() === 'w' ? 'Lượt Trắng' : 'Lượt Đen',
    type: isMaximizing ? 'MAX' : 'MIN',
    alpha: -Infinity,
    beta: Infinity,
    score: null,
    children: []
  };

  let legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) {
    root.score = evaluatePosition(chess);
    return { root, tableRows };
  }

  legalMoves = orderMoves(legalMoves);
  // Take top 3 primary moves for clear presentation
  const candidateMoves = legalMoves.slice(0, 3);
  const remainingCount = legalMoves.length - candidateMoves.length;

  let currentAlpha = -Infinity;
  let currentBeta = Infinity;
  let bestMove = null;

  if (isMaximizing) {
    let maxScore = -Infinity;

    for (let i = 0; i < candidateMoves.length; i++) {
      const move = candidateMoves[i];
      chess.move(move);

      const ply1Node = {
        id: `node_1_${i}`,
        move: move.san,
        type: 'MIN',
        alpha: currentAlpha,
        beta: currentBeta,
        score: null,
        pruned: false,
        children: []
      };

      // Evaluate opponent responses at ply 2
      let oppMoves = chess.moves({ verbose: true });
      oppMoves = orderMoves(oppMoves);
      const oppCandidates = oppMoves.slice(0, 3);
      const oppRemaining = oppMoves.length - oppCandidates.length;

      let minScore = Infinity;
      let branchCutoff = false;

      for (let j = 0; j < oppCandidates.length; j++) {
        const oppMove = oppCandidates[j];
        chess.move(oppMove);
        try {
          const evalScore = evaluatePosition(chess);
          minScore = Math.min(minScore, evalScore);
          ply1Node.beta = Math.min(ply1Node.beta, minScore);

          const ply2Node = {
            id: `node_2_${i}_${j}`,
            move: oppMove.san,
            type: 'EVAL',
            score: evalScore,
            pruned: false
          };
          ply1Node.children.push(ply2Node);

          tableRows.push({
            ply: 2,
            move: `${move.san} ➔ ${oppMove.san}`,
            role: 'MIN (Đen)',
            alpha: currentAlpha === -Infinity ? '-∞' : (currentAlpha / 100).toFixed(2),
            beta: ply1Node.beta === Infinity ? '+∞' : (ply1Node.beta / 100).toFixed(2),
            score: (evalScore / 100).toFixed(2),
            status: 'Duyệt bình thường',
            note: 'Cập nhật β'
          });

          // Check Beta cutoff
          if (currentAlpha >= ply1Node.beta) {
            branchCutoff = true;
            const skipped = oppCandidates.length - 1 - j + oppRemaining;
            ply1Node.children.push({
              id: `node_pruned_${i}`,
              move: `✂️ Bỏ qua ${skipped} nước`,
              type: 'PRUNED',
              score: null,
              pruned: true,
              reason: `α (${(currentAlpha / 100).toFixed(2)}) ≥ β (${(ply1Node.beta / 100).toFixed(2)})`
            });

            tableRows.push({
              ply: 2,
              move: `${move.san} ➔ (các nước còn lại)`,
              role: 'MIN',
              alpha: (currentAlpha / 100).toFixed(2),
              beta: (ply1Node.beta / 100).toFixed(2),
              score: '-',
              status: '✂️ CẮT TỈA (Cutoff)',
              note: `Thỏa điều kiện α ≥ β, dừng xét nhánh con`
            });
            break;
          }
        } finally {
          chess.undo();
        }
      }

      chess.undo();

      ply1Node.score = minScore;
      if (minScore > maxScore) {
        maxScore = minScore;
        bestMove = move.san;
      }
      currentAlpha = Math.max(currentAlpha, maxScore);
      root.children.push(ply1Node);

      tableRows.push({
        ply: 1,
        move: move.san,
        role: 'MAX (Trắng)',
        alpha: (currentAlpha / 100).toFixed(2),
        beta: '+∞',
        score: (minScore / 100).toFixed(2),
        status: move.san === bestMove ? '⭐ Nước tốt nhất' : 'Khả thi',
        note: `Cập nhật α = ${(currentAlpha / 100).toFixed(2)}`
      });
    }

    root.score = maxScore;
  } else {
    // Black is maximizing downwards (minimizing)
    let minScore = Infinity;

    for (let i = 0; i < candidateMoves.length; i++) {
      const move = candidateMoves[i];
      chess.move(move);

      const ply1Node = {
        id: `node_1_${i}`,
        move: move.san,
        type: 'MAX',
        alpha: currentAlpha,
        beta: currentBeta,
        score: null,
        pruned: false,
        children: []
      };

      let oppMoves = chess.moves({ verbose: true });
      oppMoves = orderMoves(oppMoves);
      const oppCandidates = oppMoves.slice(0, 3);
      const oppRemaining = oppMoves.length - oppCandidates.length;

      let maxScore = -Infinity;

      for (let j = 0; j < oppCandidates.length; j++) {
        const oppMove = oppCandidates[j];
        chess.move(oppMove);
        try {
          const evalScore = evaluatePosition(chess);
          maxScore = Math.max(maxScore, evalScore);
          ply1Node.alpha = Math.max(ply1Node.alpha, maxScore);

          ply1Node.children.push({
            id: `node_2_${i}_${j}`,
            move: oppMove.san,
            type: 'EVAL',
            score: evalScore,
            pruned: false
          });

          tableRows.push({
            ply: 2,
            move: `${move.san} ➔ ${oppMove.san}`,
            role: 'MAX (Trắng)',
            alpha: ply1Node.alpha === -Infinity ? '-∞' : (ply1Node.alpha / 100).toFixed(2),
            beta: currentBeta === Infinity ? '+∞' : (currentBeta / 100).toFixed(2),
            score: (evalScore / 100).toFixed(2),
            status: 'Duyệt bình thường',
            note: 'Cập nhật α'
          });

          if (ply1Node.alpha >= currentBeta) {
            const skipped = oppCandidates.length - 1 - j + oppRemaining;
            ply1Node.children.push({
              id: `node_pruned_${i}`,
              move: `✂️ Bỏ qua ${skipped} nước`,
              type: 'PRUNED',
              score: null,
              pruned: true,
              reason: `α (${(ply1Node.alpha / 100).toFixed(2)}) ≥ β (${(currentBeta / 100).toFixed(2)})`
            });

            tableRows.push({
              ply: 2,
              move: `${move.san} ➔ (các nước còn lại)`,
              role: 'MAX',
              alpha: (ply1Node.alpha / 100).toFixed(2),
              beta: (currentBeta / 100).toFixed(2),
              score: '-',
              status: '✂️ CẮT TỈA (Cutoff)',
              note: `Thỏa điều kiện α ≥ β, dừng xét nhánh`
            });
            break;
          }
        } finally {
          chess.undo();
        }
      }

      chess.undo();

      ply1Node.score = maxScore;
      if (maxScore < minScore) {
        minScore = maxScore;
        bestMove = move.san;
      }
      currentBeta = Math.min(currentBeta, minScore);
      root.children.push(ply1Node);

      tableRows.push({
        ply: 1,
        move: move.san,
        role: 'MIN (Đen)',
        alpha: '-∞',
        beta: (currentBeta / 100).toFixed(2),
        score: (maxScore / 100).toFixed(2),
        status: move.san === bestMove ? '⭐ Nước tốt nhất' : 'Khả thi',
        note: `Cập nhật β = ${(currentBeta / 100).toFixed(2)}`
      });
    }

    root.score = minScore;
  }

  return { root, tableRows, bestMove };
}

/**
 * Generates an SVG Tree Diagram that looks like textbook figures.
 * @param {object} root
 * @returns {string} SVG HTML string
 */
export function generateTreeSvg(root) {
  const width = 850;
  const height = 360;

  let svg = `<svg viewBox="0 0 ${width} ${height}" class="decision-tree-svg" xmlns="http://www.w3.org/2000/svg">`;

  // Define marker for arrowheads
  svg += `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
      </marker>
      <marker id="arrow-pruned" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
      </marker>
    </defs>
  `;

  // Root coords
  const rootX = width / 2;
  const rootY = 40;

  // Level 1 coords
  const l1Count = root.children.length;
  const l1Spacing = width / (l1Count + 1);

  root.children.forEach((c1, i1) => {
    const c1X = l1Spacing * (i1 + 1);
    const c1Y = 150;

    // Draw line root -> c1
    svg += `<line x1="${rootX}" y1="${rootY + 20}" x2="${c1X}" y2="${c1Y - 20}" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>`;
    // Label on line
    svg += `<text x="${(rootX + c1X) / 2}" y="${(rootY + c1Y) / 2 - 4}" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">${c1.move}</text>`;

    // Level 2 coords
    const l2Count = c1.children.length;
    if (l2Count > 0) {
      const l2SubWidth = l1Spacing * 0.9;
      const l2StartX = c1X - l2SubWidth / 2;
      const l2Step = l2SubWidth / Math.max(1, l2Count - 1);

      c1.children.forEach((c2, i2) => {
        const c2X = l2Count === 1 ? c1X : l2StartX + l2Step * i2;
        const c2Y = 280;

        if (c2.pruned) {
          // Pruned line
          svg += `<line x1="${c1X}" y1="${c1Y + 20}" x2="${c2X}" y2="${c2Y - 20}" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#arrow-pruned)"/>`;
          // Draw scissor cut icon
          svg += `<text x="${(c1X + c2X) / 2}" y="${(c1Y + c2Y) / 2}" fill="#ef4444" font-size="14" text-anchor="middle">✂️</text>`;

          // Pruned Node Box
          svg += `
            <g transform="translate(${c2X - 55}, ${c2Y - 18})">
              <rect width="110" height="36" rx="6" fill="#450a0a" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3"/>
              <text x="55" y="16" fill="#fca5a5" font-size="10" font-weight="700" text-anchor="middle">${c2.move}</text>
              <text x="55" y="28" fill="#fda4af" font-size="8" text-anchor="middle">${c2.reason || 'α ≥ β'}</text>
            </g>
          `;
        } else {
          // Normal eval line
          svg += `<line x1="${c1X}" y1="${c1Y + 20}" x2="${c2X}" y2="${c2Y - 20}" stroke="#475569" stroke-width="1.5" marker-end="url(#arrow)"/>`;
          svg += `<text x="${(c1X + c2X) / 2}" y="${(c1Y + c2Y) / 2 - 2}" fill="#94a3b8" font-size="10" text-anchor="middle">${c2.move}</text>`;

          // Leaf Eval Node
          const scoreStr = (c2.score / 100).toFixed(2);
          svg += `
            <g transform="translate(${c2X - 40}, ${c2Y - 16})">
              <rect width="80" height="32" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
              <text x="40" y="14" fill="#94a3b8" font-size="9" text-anchor="middle">${c2.move}</text>
              <text x="40" y="26" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">${scoreStr}</text>
            </g>
          `;
        }
      });
    }

    // Draw C1 Node Box (MIN or MAX)
    const isC1Max = c1.type === 'MAX';
    const c1Color = isC1Max ? '#0284c7' : '#e11d48';
    const c1Score = c1.score !== null ? (c1.score / 100).toFixed(2) : '-';

    svg += `
      <g transform="translate(${c1X - 50}, ${c1Y - 20})">
        <rect width="100" height="40" rx="8" fill="#0f172a" stroke="${c1Color}" stroke-width="2"/>
        <text x="50" y="16" fill="${c1Color}" font-size="10" font-weight="700" text-anchor="middle">${c1.type}: ${c1.move}</text>
        <text x="50" y="30" fill="#f8fafc" font-size="11" font-weight="700" text-anchor="middle">Điểm: ${c1Score}</text>
      </g>
    `;
  });

  // Draw Root Node Box
  const isRootMax = root.type === 'MAX';
  const rootColor = isRootMax ? '#38bdf8' : '#f43f5e';
  const rootScore = root.score !== null ? (root.score / 100).toFixed(2) : '-';

  svg += `
    <g transform="translate(${rootX - 70}, ${rootY - 20})">
      <rect width="140" height="40" rx="8" fill="#1e293b" stroke="${rootColor}" stroke-width="2"/>
      <text x="70" y="16" fill="${rootColor}" font-size="11" font-weight="700" text-anchor="middle">GỐC (${root.type})</text>
      <text x="70" y="30" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">Tối ưu: ${rootScore}</text>
    </g>
  `;

  svg += `</svg>`;
  return svg;
}
