import { evaluatePosition, evaluateBoard, CHECKMATE_SCORE } from './evaluation.js';
import { orderMoves } from './move-ordering.js';

/**
 * Alpha-Beta Pruning Algorithm
 * 
 * Maximizing player: White (+)
 * Minimizing player: Black (-)
 * 
 * @param {import('chess.js').Chess} chess
 * @param {number} depth
 * @param {boolean} [useMoveOrdering=true]
 * @returns {{ bestMove: object|null, bestScore: number, nodesVisited: number, cutoffs: number, branchesPruned: number, timeMs: number }}
 */
export function alphaBetaSearch(chess, depth, useMoveOrdering = true) {
  const startTime = performance.now();
  let nodesVisited = 0;
  let cutoffs = 0;
  let branchesPruned = 0;
  const isMaximizing = chess.turn() === 'w';

  /**
   * Recursive alpha-beta function
   */
  function search(currentDepth, alpha, beta, maximizing, plyFromRoot) {
    nodesVisited++;

    // Terminal state. isGameOver() uses chess.js's fast internal move generator;
    // moves({ verbose: true }) is much slower (it builds SAN for every move), so we
    // only call it below for nodes we are actually going to expand.
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        // If current turn is White and checkmated, Black won (-score)
        // If current turn is Black and checkmated, White won (+score)
        // Subtracting plyFromRoot makes the AI prefer the fastest mate
        return chess.turn() === 'w'
          ? -(CHECKMATE_SCORE - plyFromRoot)
          : (CHECKMATE_SCORE - plyFromRoot);
      }
      return 0; // Draw: stalemate, 50-move rule, insufficient material, threefold repetition
    }

    // Leaf node: static evaluation (terminal cases were already handled above,
    // so evaluateBoard skips the second isGameOver() that evaluatePosition would do)
    if (currentDepth === 0) {
      return evaluateBoard(chess);
    }

    let legalMoves = chess.moves({ verbose: true });

    if (useMoveOrdering) {
      legalMoves = orderMoves(legalMoves);
    }

    if (maximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i];
        chess.move(move);
        try {
          const score = search(currentDepth - 1, alpha, beta, false, plyFromRoot + 1);
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, maxScore);

          if (alpha >= beta) {
            cutoffs++;
            branchesPruned += (legalMoves.length - 1 - i);
            break; // Beta cutoff
          }
        } finally {
          chess.undo();
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i];
        chess.move(move);
        try {
          const score = search(currentDepth - 1, alpha, beta, true, plyFromRoot + 1);
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, minScore);

          if (alpha >= beta) {
            cutoffs++;
            branchesPruned += (legalMoves.length - 1 - i);
            break; // Alpha cutoff
          }
        } finally {
          chess.undo();
        }
      }
      return minScore;
    }
  }

  // Root level search
  let moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return {
      bestMove: null,
      bestScore: evaluatePosition(chess),
      nodesVisited: 0,
      cutoffs: 0,
      branchesPruned: 0,
      timeMs: 0
    };
  }

  if (useMoveOrdering) {
    moves = orderMoves(moves);
  }

  let bestMove = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move);
    try {
      const score = search(depth - 1, alpha, beta, !isMaximizing, 1);
      if (isMaximizing) {
        if (score > bestScore || bestMove === null) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore || bestMove === null) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }
    } finally {
      chess.undo();
    }
  }

  const timeMs = performance.now() - startTime;
  return {
    bestMove,
    bestScore,
    nodesVisited,
    cutoffs,
    branchesPruned,
    timeMs
  };
}
