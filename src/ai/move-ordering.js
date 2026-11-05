import { PIECE_VALUES } from './evaluation.js';

/**
 * Score a single move for move ordering (MVV-LVA heuristic + promotions)
 * @param {object} move - verbose move object from chess.js
 * @returns {number} heuristic score
 */
function scoreMove(move) {
  let score = 0;

  // 1. Promotions
  if (move.promotion) {
    score += 8000;
  }

  // 2. Captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 100;
    const attackerVal = PIECE_VALUES[move.piece] || 100;
    score += 10000 + (victimVal * 10 - attackerVal);
  }

  // 3. Checks - often forcing, worth trying before quiet moves
  if (move.san.includes('+') || move.san.includes('#')) {
    score += 500;
  }

  // 4. Castling (kingside 'k' or queenside 'q' flag) - good for king safety
  if (move.flags.includes('k') || move.flags.includes('q')) {
    score += 50;
  }

  return score;
}

/**
 * Orders a list of legal moves to maximize early alpha-beta cutoffs.
 * @param {Array<object>} moves - Array of verbose moves from chess.moves({ verbose: true })
 * @returns {Array<object>} sorted moves descending by expected strength
 */
export function orderMoves(moves) {
  return [...moves].sort((a, b) => scoreMove(b) - scoreMove(a));
}
