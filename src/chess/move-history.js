export class MoveHistoryView {
  constructor(container) {
    this.container = container;
    this.moves = [];
  }

  setMoves(historySAN) {
    this.moves = [];
    for (let i = 0; i < historySAN.length; i += 2) {
      this.moves.push({
        num: Math.floor(i / 2) + 1,
        white: historySAN[i] || '',
        black: historySAN[i + 1] || ''
      });
    }
    this.render();
  }

  render() {
    if (this.moves.length === 0) {
      this.container.innerHTML = `<div class="history-empty">Chưa có nước đi nào</div>`;
      return;
    }

    let html = `
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Trắng</th>
            <th>Đen</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const m of this.moves) {
      html += `
        <tr>
          <td class="history-num">${m.num}.</td>
          <td class="history-white">${m.white}</td>
          <td class="history-black">${m.black}</td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    this.container.innerHTML = html;

    // Scroll to bottom
    this.container.scrollTop = this.container.scrollHeight;
  }
}
