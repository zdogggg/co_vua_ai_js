import { evaluatePosition, evaluateBoard, CHECKMATE_SCORE } from './evaluation.js';
import { orderMoves } from './move-ordering.js';

/**
 * Minimax Search Algorithm
 * 
 * Explores the complete game tree up to specified depth.
 * Maximizing player: White (+)
 * Minimizing player: Black (-)
 * 
 * @param {import('chess.js').Chess} chess
 * @param {number} depth
 * @param {boolean} [useMoveOrdering=false] - only affects tie-breaking, not node count
 * @returns {{ bestMove: object|null, bestScore: number, nodesVisited: number, timeMs: number }}
 */
export function minimaxSearch(chess, depth, useMoveOrdering = false) {
  const startTime = performance.now();
  let nodesVisited = 0;
  const isMaximizing = chess.turn() === 'w';

  /**
   * Recursive minimax function
   */
  function search(currentDepth, maximizing, plyFromRoot) {
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
      for (const move of legalMoves) {
        chess.move(move);
        try {
          const score = search(currentDepth - 1, false, plyFromRoot + 1);
          if (score > maxScore) {
            maxScore = score;
          }
        } finally {
          chess.undo();
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of legalMoves) {
        chess.move(move);
        try {
          const score = search(currentDepth - 1, true, plyFromRoot + 1);
          if (score < minScore) {
            minScore = score;
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
      timeMs: 0
    };
  }

  // Move ordering does not change Minimax's node count (no pruning), but using the
  // same order as Alpha-Beta makes both pick the same move when scores are tied.
  if (useMoveOrdering) {
    moves = orderMoves(moves);
  }

  let bestMove = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    try {
      const score = search(depth - 1, !isMaximizing, 1);
      if (isMaximizing) {
        if (score > bestScore || bestMove === null) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore || bestMove === null) {
          bestScore = score;
          bestMove = move;
        }
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
    timeMs
  };
}
