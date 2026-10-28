import { Chess } from 'chess.js';
import { evaluatePosition } from '../ai/evaluation.js';
import { orderMoves } from '../ai/move-ordering.js';

/**
 * Builds an illustrative search tree snapshot for presentation and defense.
 * Traces Alpha-Beta pruning decision points with exact alpha/beta/cutoff reasons.
 * 
 * @param {import('chess.js').Chess} chess
 * @param {number} [depth=2]
 * @param {number} [maxBranches=4] - Limits branches per node for clean visual presentation
 * @returns {object} Tree root node with children and cutoff metadata
 */
export function buildExplanationTree(chess, depth = 2, maxBranches = 4) {
  const isMaximizing = chess.turn() === 'w';

  function traceNode(currentDepth, alpha, beta, maximizing, moveSan = 'Root', ply = 0) {
    const node = {
      id: Math.random().toString(36).substring(2, 9),
      name: moveSan,
      ply,
      type: maximizing ? 'MAX' : 'MIN',
      alphaBefore: alpha,
      betaBefore: beta,
      score: 0,
      pruned: false,
      prunedChildren: 0,
      cutoffReason: null,
      children: []
    };

    if (chess.isGameOver() || currentDepth === 0) {
      node.score = evaluatePosition(chess);
      return node;
    }

    let legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      node.score = evaluatePosition(chess);
      return node;
    }

    legalMoves = orderMoves(legalMoves);
    const candidateMoves = legalMoves.slice(0, maxBranches);
    const remainingCount = legalMoves.length - candidateMoves.length;

    let currentAlpha = alpha;
    let currentBeta = beta;

    if (maximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < candidateMoves.length; i++) {
        const move = candidateMoves[i];
        chess.move(move);
        try {
          const childNode = traceNode(currentDepth - 1, currentAlpha, currentBeta, false, move.san, ply + 1);
          node.children.push(childNode);
          maxScore = Math.max(maxScore, childNode.score);
          currentAlpha = Math.max(currentAlpha, maxScore);

          if (currentAlpha >= currentBeta) {
            // Cutoff occurred!
            const skipped = candidateMoves.length - 1 - i + remainingCount;
            // Mark a dummy ghost node representing the pruned branches
            if (skipped > 0) {
              node.children.push({
                id: Math.random().toString(36).substring(2, 9),
                name: `✂️ ${skipped} nhánh con`,
                ply: ply + 1,
                type: 'MIN',
                score: null,
                pruned: true,
                cutoffReason: `α (${(currentAlpha / 100).toFixed(2)}) ≥ β (${(currentBeta / 100).toFixed(2)})`,
                children: []
              });
            }
            break;
          }
        } finally {
          chess.undo();
        }
      }
      node.score = maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < candidateMoves.length; i++) {
        const move = candidateMoves[i];
        chess.move(move);
        try {
          const childNode = traceNode(currentDepth - 1, currentAlpha, currentBeta, true, move.san, ply + 1);
          node.children.push(childNode);
          minScore = Math.min(minScore, childNode.score);
          currentBeta = Math.min(currentBeta, minScore);

          if (currentAlpha >= currentBeta) {
            const skipped = candidateMoves.length - 1 - i + remainingCount;
            if (skipped > 0) {
              node.children.push({
                id: Math.random().toString(36).substring(2, 9),
                name: `✂️ ${skipped} nhánh con`,
                ply: ply + 1,
                type: 'MAX',
                score: null,
                pruned: true,
                cutoffReason: `α (${(currentAlpha / 100).toFixed(2)}) ≥ β (${(currentBeta / 100).toFixed(2)})`,
                children: []
              });
            }
            break;
          }
        } finally {
          chess.undo();
        }
      }
      node.score = minScore;
    }

    return node;
  }

  return traceNode(depth, -Infinity, Infinity, isMaximizing, `Bàn cờ hiện tại (${chess.turn() === 'w' ? 'Trắng' : 'Đen'} đi)`);
}
