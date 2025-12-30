(() => {
  const qs = new URLSearchParams(location.search);
  const file = qs.get('file') || 'assets/pdfs/masato_nasu_portfolio_2025.pdf';

  const titleEl = document.getElementById('title');
  const openPdf = document.getElementById('openPdf');
  const pagesEl = document.getElementById('pages');
  const metaEl = document.getElementById('meta');

  titleEl.textContent = decodeURIComponent(file.split('/').pop() || 'PDF');
  openPdf.href = file;

  // pdf.js worker
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.js';
  }

  function createPageShell(pageNumber) {
    const wrap = document.createElement('div');
    wrap.className = 'page';
    wrap.dataset.page = String(pageNumber);

    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = `Rendering page ${pageNumber}…`;
    wrap.appendChild(ph);

    return wrap;
  }

  function calcScaleForContainer(pageViewport, containerWidth) {
    // containerWidth にフィット（少し余白）
    const target = Math.max(320, Math.min(containerWidth, 980)) - 2; // borders
    return target / pageViewport.width;
  }

  async function renderPage(pdf, pageNumber, wrap) {
    const page = await pdf.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });

    // 画面幅に合わせてスケール
    const containerWidth = Math.min(document.documentElement.clientWidth, 980);
    const scale = calcScaleForContainer(unscaled, containerWidth);
    const viewport = page.getViewport({ scale });

    // HiDPI対応
    const outputScale = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    const renderContext = {
      canvasContext: ctx,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
    };

    // 置き換え
    wrap.innerHTML = '';
    wrap.appendChild(canvas);

    await page.render(renderContext).promise;
  }

  async function main() {
    try {
      const loadingTask = window.pdfjsLib.getDocument({ url: file });
      const pdf = await loadingTask.promise;

      metaEl.textContent = `${pdf.numPages} pages`;

      // ページの“枠”だけ先に作って、スクロールで必要な分だけ描画（軽量）
      const shells = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const shell = createPageShell(p);
        pagesEl.appendChild(shell);
        shells.push(shell);
      }

      const rendered = new Set();

      const io = new IntersectionObserver(async (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const wrap = e.target;
          const p = Number(wrap.dataset.page);
          if (!p || rendered.has(p)) continue;
          rendered.add(p);
          try {
            await renderPage(pdf, p, wrap);
          } catch (err) {
            wrap.innerHTML = `<div class="ph">Failed to render page ${p}: ${String(err)}</div>`;
          }
        }
      }, { rootMargin: '800px 0px' }); // 先読み

      shells.forEach(s => io.observe(s));

      // リサイズ時は、表示中ページだけ再描画したければここで対応可能（必要なら後で）
    } catch (e) {
      pagesEl.innerHTML = `<div class="ph">PDFの読み込みに失敗しました: ${String(e)}</div>`;
    }
  }

  main();
})();
