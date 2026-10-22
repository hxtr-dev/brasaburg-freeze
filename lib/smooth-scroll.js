// Rolagem animada até um elemento, com duração proporcional à distância,
// para o cliente ver a página passar pelas seções no caminho.
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function scrollToSection(id, offset = 140) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = window.scrollY;
  const target = Math.max(0, el.getBoundingClientRect().top + start - offset);
  const distance = target - start;
  if (Math.abs(distance) < 2) return;

  // Rolagem lenta o bastante para o cliente ver o site passando pelas seções. Roda mesmo com
  // "reduzir movimento" ligado no aparelho, porque foi o próprio cliente que pediu a rolagem.
  const duration = Math.min(2200, Math.max(1200, Math.abs(distance) * 1.1));
  const t0 = performance.now();
  // Desliga o scroll-behavior: smooth do CSS enquanto a animação controla a rolagem.
  const root = document.documentElement;
  const prev = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + distance * easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
    else root.style.scrollBehavior = prev;
  };
  requestAnimationFrame(step);
  history.replaceState(null, '', `#${id}`);
}
