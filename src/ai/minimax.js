import { evaluatePosition, CHECKMATE_SCORE } from './evaluation.js';

/**
 * Minimax Search Algorithm
 * 
 * Explores the complete game tree up to specified depth.
 * Maximizing player: White (+)
 * Minimizing player: Black (-)
 * 
 * @param {import('chess.js').Chess} chess
 * @param {number} depth
 * @param {boolean} [useMoveOrdering=false]
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

    // Check terminal state
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        // If current turn is White and checkmated, Black won (-score)
        // If current turn is Black and checkmated, White won (+score)
        return chess.turn() === 'w' 
          ? -(CHECKMATE_SCORE - plyFromRoot) 
          : (CHECKMATE_SCORE - plyFromRoot);
      }
      return 0; // Draw
    }

    // Leaf node
    if (currentDepth === 0) {
      return evaluatePosition(chess);
    }

    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      return evaluatePosition(chess);
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
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return {
      bestMove: null,
      bestScore: evaluatePosition(chess),
      nodesVisited: 0,
      timeMs: 0
    };
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
