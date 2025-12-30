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
  const img = el('img', { class:'thumb', src:w.thumb || '', alt:w.title || '' });
  const content = el('div', { class:'content' });

  const titleRow = el('div', { class:'title' }, [
    el('h2', {}, [w.title || 'Untitled']),
    el('span', { class:'badge' }, [String(w.year ?? '')]),
    el('span', { class:'badge' }, [w.type || ''])
  ]);

  const catchText = el('div', { class:'catch' }, [w.catch || '']);

  const tags = el('div', { class:'tags' });
  (w.tags || []).forEach(t => tags.appendChild(el('span', { class:'tag' }, [t])));

  const actions = el('div', { class:'actions' });

  // PDF をブラウザで直接開く
  if (w.links?.pdf) {
    actions.appendChild(el('a', {
      class:'btn',
      href:w.links.pdf,
      target:'_blank',
      rel:'noopener'
    }, ['OPEN']));
  }

  // 追加リンク（demo/repo等がある場合）
  for (const key of ['demo','repo','article']) {
    if (w.links?.[key]) {
      actions.appendChild(el('a', { class:'btn', href:w.links[key], target:'_blank', rel:'noopener' }, [key.toUpperCase()]));
    }
  }

  content.appendChild(titleRow);
  content.appendChild(catchText);
  content.appendChild(tags);
  content.appendChild(actions);

  card.appendChild(img);
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
