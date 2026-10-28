import { Chess } from 'chess.js';
import { minimaxSearch } from './minimax.js';
import { alphaBetaSearch } from './alpha-beta.js';

self.onmessage = function (e) {
  const { id, fen, algorithm, depth, useMoveOrdering } = e.data;
  
  try {
    const chess = new Chess(fen);
    let result;

    if (algorithm === 'minimax') {
      result = minimaxSearch(chess, depth, useMoveOrdering);
    } else {
      result = alphaBetaSearch(chess, depth, useMoveOrdering);
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
