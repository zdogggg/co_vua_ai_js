export function getGameStatus(chess) {
  const turn = chess.turn();
  const turnName = turn === 'w' ? 'Trắng' : 'Đen';
  const isCheck = chess.inCheck();
  const isGameOver = chess.isGameOver();

  if (isGameOver) {
    if (chess.isCheckmate()) {
      const winner = turn === 'w' ? 'Đen' : 'Trắng';
      return {
        isGameOver: true,
        type: 'checkmate',
        badgeClass: 'badge-danger',
        message: `Chiếu hết! ${winner} thắng cuộc! 🏆`
      };
    }

    if (chess.isStalemate()) {
      return {
        isGameOver: true,
        type: 'stalemate',
        badgeClass: 'badge-warning',
        message: 'Hòa cờ: Hòa bí (Stalemate)!'
      };
    }

    if (chess.isThreefoldRepetition()) {
      return {
        isGameOver: true,
        type: 'threefold',
        badgeClass: 'badge-warning',
        message: 'Hòa cờ: Lặp lại thế cờ 3 lần!'
      };
    }

    if (chess.isInsufficientMaterial()) {
      return {
        isGameOver: true,
        type: 'insufficient',
        badgeClass: 'badge-warning',
        message: 'Hòa cờ: Không đủ lực lượng chiếu hết!'
      };
    }

    return {
      isGameOver: true,
      type: 'draw',
      badgeClass: 'badge-warning',
      message: 'Ván đấu kết thúc hòa!'
    };
  }

  if (isCheck) {
    return {
      isGameOver: false,
      type: 'check',
      badgeClass: 'badge-danger',
      message: `Đang bị chiếu! Lượt của ${turnName}`
    };
  }

  return {
    isGameOver: false,
    type: 'normal',
    badgeClass: turn === 'w' ? 'badge-white' : 'badge-black',
    message: `Đang đến lượt ${turnName} đi`
  };
}
