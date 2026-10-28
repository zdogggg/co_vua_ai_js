import { Chess } from 'chess.js';
import { minimaxSearch } from './minimax.js';
import { alphaBetaSearch } from './alpha-beta.js';

let worker = null;
let currentRequestId = 0;
const pendingRequests = new Map();

function getWorker() {
  if (typeof Worker !== 'undefined' && !worker) {
    try {
      worker = new Worker(new URL('./search-worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        const { id, success, result, error } = e.data;
        const pending = pendingRequests.get(id);
        if (pending) {
          pendingRequests.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      };
      worker.onerror = (err) => {
        console.error('Worker error:', err);
      };
    } catch (err) {
      console.warn('Web Worker initialization failed, falling back to main thread.', err);
      worker = null;
    }
  }
  return worker;
}

/**
 * Asynchronously finds the best move for a given FEN position.
 * @param {string} fen
 * @param {object} options
 * @param {string} [options.algorithm='alphabeta'] - 'minimax' or 'alphabeta'
 * @param {number} [options.depth=3]
 * @param {boolean} [options.useMoveOrdering=true]
 * @returns {Promise<{ bestMove: object, bestScore: number, nodesVisited: number, cutoffs?: number, branchesPruned?: number, timeMs: number }>}
 */
export async function findBestMove(fen, options = {}) {
  const {
    algorithm = 'alphabeta',
    depth = 3,
    useMoveOrdering = true
  } = options;

  const activeWorker = getWorker();

  if (activeWorker) {
    return new Promise((resolve, reject) => {
      const id = ++currentRequestId;
      pendingRequests.set(id, { resolve, reject });
      activeWorker.postMessage({
        id,
        fen,
        algorithm,
        depth,
        useMoveOrdering
      });
    });
  }

  // Fallback to synchronous execution on main thread
  const chess = new Chess(fen);
  if (algorithm === 'minimax') {
    return minimaxSearch(chess, depth, useMoveOrdering);
  } else {
    return alphaBetaSearch(chess, depth, useMoveOrdering);
  }
}
