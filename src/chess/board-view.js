import { getPieceSvg } from './pieces.js';

export class BoardView {
  /**
   * @param {HTMLElement} container - DOM element holding the board
   * @param {object} options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onSquareClick = options.onSquareClick || (() => {});
    this.onPromotionSelect = options.onPromotionSelect || (() => {});
    this.flipped = false;
    
    this.selectedSquare = null;
    this.legalDestinations = new Map(); // square -> isCapture
    this.lastMove = null; // { from, to }
    this.checkSquare = null;

    this.pendingPromotion = null; // { from, to, color }

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="chessboard-wrapper">
        <div class="chessboard" id="chessboard"></div>
        <div class="promotion-modal hidden" id="promotion-modal">
          <div class="promotion-choices" id="promotion-choices"></div>
        </div>
      </div>
    `;

    this.boardEl = this.container.querySelector('#chessboard');
    this.promotionModalEl = this.container.querySelector('#promotion-modal');
    this.promotionChoicesEl = this.container.querySelector('#promotion-choices');

    this.boardEl.addEventListener('click', (e) => {
      const squareEl = e.target.closest('.square');
      if (!squareEl) return;
      const square = squareEl.dataset.square;
      if (square) {
        this.onSquareClick(square);
      }
    });
  }

  setFlipped(flipped) {
    if (this.flipped !== flipped) {
      this.flipped = flipped;
    }
  }

  setHighlights({ selected = null, legalMoves = [], lastMove = null, checkSquare = null }) {
    this.selectedSquare = selected;
    this.legalDestinations.clear();
    for (const m of legalMoves) {
      this.legalDestinations.set(m.to, !!m.captured);
    }
    this.lastMove = lastMove;
    this.checkSquare = checkSquare;
  }

  showPromotionModal(color, onSelect) {
    this.promotionChoicesEl.innerHTML = '';
    const pieces = ['q', 'r', 'b', 'n'];

    for (const type of pieces) {
      const btn = document.createElement('button');
      btn.className = 'promotion-btn';
      btn.innerHTML = getPieceSvg({ type, color });
      btn.onclick = () => {
        this.hidePromotionModal();
        onSelect(type);
      };
      this.promotionChoicesEl.appendChild(btn);
    }

    this.promotionModalEl.classList.remove('hidden');
  }

  hidePromotionModal() {
    this.promotionModalEl.classList.add('hidden');
    this.promotionChoicesEl.innerHTML = '';
  }

  /**
   * Re-renders the board given the current chess.js board state
   * @param {Array<Array<{ type: string, color: string }|null>>} boardMatrix
   */
  render(boardMatrix) {
    this.boardEl.innerHTML = '';

    const ranks = this.flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const files = this.flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      const rank = ranks[rIdx];
      // In chess.js board matrix: row 0 is rank 8, row 7 is rank 1
      const matrixRow = 8 - rank;

      for (let fIdx = 0; fIdx < 8; fIdx++) {
        const file = files[fIdx];
        const matrixCol = file.charCodeAt(0) - 97; // 'a' -> 0

        const square = `${file}${rank}`;
        const isLight = (rIdx + fIdx) % 2 === 0;

        const squareEl = document.createElement('div');
        squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
        squareEl.dataset.square = square;

        // Coordinates display
        if (fIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord coord-rank';
          rankLabel.textContent = rank;
          squareEl.appendChild(rankLabel);
        }
        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord coord-file';
          fileLabel.textContent = file;
          squareEl.appendChild(fileLabel);
        }

        // Apply highlights
        if (this.selectedSquare === square) {
          squareEl.classList.add('selected');
        }

        if (this.lastMove && (this.lastMove.from === square || this.lastMove.to === square)) {
          squareEl.classList.add('last-move');
        }

        if (this.checkSquare === square) {
          squareEl.classList.add('in-check');
        }

        // Legal move indicators
        if (this.legalDestinations.has(square)) {
          const isCapture = this.legalDestinations.get(square);
          const hint = document.createElement('div');
          hint.className = isCapture ? 'move-hint-capture' : 'move-hint-dot';
          squareEl.appendChild(hint);
        }

        // Piece
        const piece = boardMatrix[matrixRow][matrixCol];
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
          pieceEl.innerHTML = getPieceSvg(piece);
          squareEl.appendChild(pieceEl);
        }

        this.boardEl.appendChild(squareEl);
      }
    }
  }
}
