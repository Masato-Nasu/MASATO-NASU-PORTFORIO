async function loadWorks() {
  const res = await fetch('./works.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('works.json の読み込みに失敗しました');
  return await res.json();
}

function el(tag, attrs={}, children=[]) {
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
}

function renderCard(w) {
  const card = el('div', { class:'card' });
  const content = el('div', { class:'content' });

  const titleRow = el('div', { class:'title' }, [
    el('h2', {}, [w.title || 'Untitled'])
  ]);

  const actions = el('div', { class:'actions' });
  if (w.links?.pdf) {
    actions.appendChild(el('a', {
      class:'btn',
      href:w.links.pdf,
      target:'_blank',
      rel:'noopener'
    }, ['OPEN']));
  }

  content.appendChild(titleRow);
  content.appendChild(actions);
  card.appendChild(content);
  return card;
}

(async () => {
  const grid = document.getElementById('grid');
  try {
    const works = await loadWorks();
    works.forEach(w => grid.appendChild(renderCard(w)));
  } catch (e) {
    grid.appendChild(el('div', { class:'card' }, [
      el('div', { class:'content' }, [String(e)])
    ]));
  }
})();
