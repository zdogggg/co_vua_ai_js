import { Chess } from 'chess.js';
import { minimaxSearch } from '../ai/minimax.js';
import { alphaBetaSearch } from '../ai/alpha-beta.js';

export const BENCHMARK_POSITIONS = [
  {
    name: 'Khai cuộc tiêu chuẩn (Starting Position)',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    recommendedDepth: 3
  },
  {
    name: 'Trung cuộc chiến thuật (Italian Game)',
    fen: 'r1bqk2r/pppp1ppp/2n5/1B2p3/4n3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 1 5',
    recommendedDepth: 3
  },
  {
    name: 'Bẫy khai cuộc & Tấn công cánh vua',
    fen: 'r1b1k2r/ppppqppp/2n2n2/2b5/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 6',
    recommendedDepth: 3
  },
  {
    name: 'Tàn cuộc Tốt (Pawn Endgame)',
    fen: '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1',
    recommendedDepth: 4
  }
];

/**
 * Runs a benchmark test comparing Minimax and Alpha-Beta on a position.
 * @param {string} fen
 * @param {number} depth
 * @param {boolean} [useMoveOrdering=true]
 * @returns {object}
 */
export function runBenchmarkComparison(fen, depth, useMoveOrdering = true) {
  const chessMinimax = new Chess(fen);
  const chessAlphaBeta = new Chess(fen);

  const mmResult = minimaxSearch(chessMinimax, depth);
  const abResult = alphaBetaSearch(chessAlphaBeta, depth, useMoveOrdering);

  const nodeSavings = mmResult.nodesVisited > 0
    ? ((1 - abResult.nodesVisited / mmResult.nodesVisited) * 100)
    : 0;

  const speedup = abResult.timeMs > 0
    ? (mmResult.timeMs / abResult.timeMs)
    : 1;

  return {
    fen,
    depth,
    useMoveOrdering,
    minimax: {
      bestMove: mmResult.bestMove?.san || mmResult.bestMove?.lan || 'N/A',
      score: mmResult.bestScore,
      nodes: mmResult.nodesVisited,
      timeMs: Number(mmResult.timeMs.toFixed(1))
    },
    alphaBeta: {
      bestMove: abResult.bestMove?.san || abResult.bestMove?.lan || 'N/A',
      score: abResult.bestScore,
      nodes: abResult.nodesVisited,
      cutoffs: abResult.cutoffs,
      branchesPruned: abResult.branchesPruned,
      timeMs: Number(abResult.timeMs.toFixed(1))
    },
    savingsPercent: Number(nodeSavings.toFixed(1)),
    speedup: Number(speedup.toFixed(2))
  };
}
