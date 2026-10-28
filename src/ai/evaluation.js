/**
 * Evaluation Module for Chess AI
 * 
 * Convention:
 *  - Positive score favors White (+)
 *  - Negative score favors Black (-)
 *  - Zero represents an equal position or draw
 */

export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

export const CHECKMATE_SCORE = 100000;

// Piece-Square Tables (PST) from White's perspective (a8 -> h1 / rank 8 -> rank 1)
// Notice index 0 is a8, index 63 is h1.
// In 8x8 matrix (rank 8 down to rank 1):
const PAWN_TABLE = [
    0,   0,   0,   0,   0,   0,   0,   0, // rank 8 (promoted)
   50,  50,  50,  50,  50,  50,  50,  50, // rank 7
   10,  10,  20,  30,  30,  20,  10,  10, // rank 6
    5,   5,  10,  25,  25,  10,   5,   5, // rank 5
    0,   0,   0,  20,  20,   0,   0,   0, // rank 4
    5,  -5, -10,   0,   0, -10,  -5,   5, // rank 3
    5,  10,  10, -20, -20,  10,  10,   5, // rank 2
    0,   0,   0,   0,   0,   0,   0,   0  // rank 1
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   0,   0,   0, -20, -40,
  -30,   0,  10,  15,  15,  10,   0, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30,   5,  10,  15,  15,  10,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   0,   5,   0,   0,   5,   0, -10,
  -10,  10,  10,  10,  10,  10,  10, -10,
  -10,   0,  10,  10,  10,  10,   0, -10,
  -10,   5,   5,  10,  10,   5,   5, -10,
  -10,   0,   5,  10,  10,   5,   0, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];

const ROOK_TABLE = [
    0,   0,   0,   0,   0,   0,   0,   0,
    5,  10,  10,  10,  10,  10,  10,   5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
    0,   0,   0,   5,   5,   0,   0,   0
];

const QUEEN_TABLE = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,   5,   5,   5,   0, -10,
   -5,   0,   5,   5,   5,   5,   0,  -5,
    0,   0,   5,   5,   5,   5,   0,  -5,
  -10,   5,   5,   5,   5,   5,   0, -10,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20
];

const KING_TABLE_MIDDLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20
];

const PST = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE_MIDDLE
};

/**
 * Returns static evaluation score for a position in centipawns.
 * @param {import('chess.js').Chess} chess
 * @returns {number} positive for White, negative for Black
 */
export function evaluatePosition(chess) {
  // If game is over, handle terminal conditions
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      // If White to move and checkmated, Black wins (negative)
      // If Black to move and checkmated, White wins (positive)
      return chess.turn() === 'w' ? -CHECKMATE_SCORE : CHECKMATE_SCORE;
    }
    // Draw by stalemate, 3-fold repetition, 50-move rule, insufficient material
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceVal = PIECE_VALUES[piece.type] || 0;
      
      // Calculate Piece-Square Table bonus
      // For white: table is indexed from r = 0 (rank 8) to r = 7 (rank 1)
      // For black: mirror vertically (7 - r)
      const table = PST[piece.type];
      let pstVal = 0;
      if (table) {
        const sqIndex = piece.color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
        pstVal = table[sqIndex] || 0;
      }

      const totalVal = pieceVal + pstVal;

      if (piece.color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}
