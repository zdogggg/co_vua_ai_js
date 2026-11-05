import { Chess } from 'chess.js';
import { minimaxSearch } from './minimax.js';
import { alphaBetaSearch } from './alpha-beta.js';
import { runBenchmarkComparison } from '../analysis/benchmark.js';

self.onmessage = function (e) {
  const { id, type = 'search', fen, algorithm, depth, useMoveOrdering } = e.data;

  try {
    let result;

    if (type === 'benchmark') {
      result = runBenchmarkComparison(fen, depth, useMoveOrdering);
    } else {
      const chess = new Chess(fen);
      if (algorithm === 'minimax') {
        result = minimaxSearch(chess, depth, useMoveOrdering);
      } else {
        result = alphaBetaSearch(chess, depth, useMoveOrdering);
      }
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
