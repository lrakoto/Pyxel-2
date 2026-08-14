/** Full-screen text cards for the cold open and the ending. */
export function showCards(
  cards: { text: string; hold: number }[],
  opts: { onDone?: () => void; className?: string } = {},
) {
  const root = document.getElementById('cards')!;
  root.className = opts.className ?? '';
  root.style.display = 'flex';
  let i = 0;

  const step = () => {
    if (i >= cards.length) {
      root.style.display = 'none';
      root.textContent = '';
      opts.onDone?.();
      return;
    }
    const card = cards[i++];
    root.textContent = '';
    const el = document.createElement('div');
    el.className = 'card';
    el.textContent = card.text;
    root.appendChild(el);
    // retrigger the animation
    void el.offsetWidth;
    el.classList.add('in');
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(step, 650);
    }, card.hold * 1000);
  };
  step();
}
