  // ---- 送り: ←→キー・クリック・スペース。URL の #n で途中から開ける ----
  const slides = [...document.querySelectorAll('section')];
  const pageno = document.getElementById('pageno');
  let cur = Math.min(Math.max((parseInt(location.hash.slice(1)) || 1) - 1, 0), slides.length - 1);

  function show(n) {
    cur = Math.min(Math.max(n, 0), slides.length - 1);
    slides.forEach((s, i) => s.classList.toggle('current', i === cur));
    pageno.textContent = (cur + 1) + ' / ' + slides.length;
    history.replaceState(null, '', '#' + (cur + 1));
    fit();
  }
  // 画面幅に合わせて 1280x720 を等倍縮尺。zoom は右上の +/- で人が足す倍率（1 が等倍）
  let zoom = 1;
  function fit() {
    const scale = Math.min(innerWidth / 1320, innerHeight / 760, 1) * zoom;
    slides[cur].style.transform = 'scale(' + scale + ')';
  }
  function setZoom(z) {
    zoom = Math.min(Math.max(Math.round(z * 10) / 10, 0.5), 2);
    fit();
  }
  // 枚へのリンク（<a href="#12">）で飛べるようにする。show() は replaceState なので hashchange は起きない
  addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1));
    if (n) show(n - 1);
  });
  addEventListener('resize', fit);
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') show(cur + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(cur - 1);
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(slides.length - 1);
  });
  // クリックでは送らない——文字を選んだり、リンクを押したりする邪魔になるため。
  // 送りは矢印キー（←→）・スペース・画面下の戻る/進むボタンの3系統。

  // ---- 表紙で「戻る」「先頭へ」を押したときの行き先 ----
  // 入ってきた所（たいていは html/index.html の目次）へ戻す。ブラウザが直前のページを
  // 覚えているのでそこへ帰す——枚へのリンク（#12）はページを移らないので、最初に入ってきた
  // 所が最後まで残る。直接 URL を打った・外のサイトから来た場合は覚えが無いので、目次へ落とす。
  function backOut() {
    const here = new URL(location.href);
    if (document.referrer) {
      const ref = new URL(document.referrer, location.href);
      if (ref.origin === here.origin && ref.pathname !== here.pathname) {
        location.href = ref.href;
        return;
      }
    }
    // 逃げ先＝目次。分割の原本は slides/<テーマ>/<日付>/ の3つ下、ワンファイル版は html/<テーマ>/ の1つ下
    location.href = document.querySelector('link[rel=stylesheet]')
      ? '../../../html/index.html' : '../index.html';
  }

  // ---- 戻る/進む/先頭へ のボタン（標準装備・js が自動で生成する） ----
  // 左上=先頭へ、左下=戻る、右下=次へ。どの公演にも必ず付ける。
  for (const [id, label, go] of [
    ['prevbtn', '← 戻る', () => cur - 1],
    ['nextbtn', '次へ →', () => cur + 1],
    ['homebtn', '⇐ 先頭へ', () => 0],
  ]) {
    const b = document.createElement('button');
    b.id = id; b.className = 'navbtn'; b.textContent = label;
    b.addEventListener('click', e => {
      e.stopPropagation();
      // 表紙で「戻る」「先頭へ」を押したら、枚の行き先が無い。入ってきた所（目次）へ出る。
      if (cur === 0 && id !== 'nextbtn') { backOut(); return; }
      show(go());
    });
    document.body.appendChild(b);
  }

  // ---- 拡大・縮小のボタン（右上・標準装備）。1回で 0.1 ずつ、0.5〜2.0 倍 ----
  // 押した枚だけでなく、以後めくる枚にもそのまま効く（fit() が毎回 zoom を掛ける）。
  for (const [id, label, act] of [
    ['zoomoutbtn', '\u2212', () => setZoom(zoom - 0.1)],
    ['zoominbtn', '\uff0b', () => setZoom(zoom + 0.1)],
  ]) {
    const b = document.createElement('button');
    b.id = id; b.className = 'navbtn zoombtn'; b.textContent = label;
    b.title = (id === 'zoominbtn' ? '大きく' : '小さく');
    b.addEventListener('click', e => { e.stopPropagation(); act(); });
    document.body.appendChild(b);
  }

  // ---- ?tonmana=<名前> で開かれたら、そのトンマナを当てて表示する（見本帳から使う） ----
  {
    const m = location.search.match(/[?&]tonmana=([a-z0-9_-]+)/);
    const link = document.querySelector('link[rel=stylesheet]');
    if (m && link) link.href = '../../../materials/tonmana/' + m[1] + '/style.css';
  }

  // ---- 試着（トンマナの切り替え）: URL に ?fit を付けたときだけ出る ----
  // 分割構成の原本を開いているときだけ働く（ワンファイル版は CSS が埋め込みなので出ない）
  if (location.search.includes('fit') && document.querySelector('link[rel=stylesheet]')) {
    const link = document.querySelector('link[rel=stylesheet]');
    const names = ['plain', 'gold', 'blue'];   // materials/tonmana/<名前>/ を足したらここへ名前を足す
    const bar = document.createElement('div');
    bar.id = 'fitbar';
    bar.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:20;'
      + 'display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:8px;'
      + 'background:rgba(20,22,26,.82);backdrop-filter:blur(4px)';
    const label = document.createElement('span');
    label.textContent = '試着';
    label.style.cssText = 'color:#9aa2ab;font-size:13px;letter-spacing:.1em;margin-right:4px';
    bar.appendChild(label);
    let now = names[0];
    const btns = {};
    for (const name of names) {
      const b = document.createElement('button');
      b.textContent = name;
      b.style.cssText = 'padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.25);'
        + 'background:rgba(255,255,255,.08);color:#cfd6d3;font:inherit;font-size:14px;cursor:pointer';
      b.addEventListener('click', e => {
        e.stopPropagation();
        // 素材庫の CSS を直に読む（公演の css/style.css は書き換えない）
        link.href = '../../../materials/tonmana/' + name + '/style.css?t=' + Date.now();
        now = name;
        for (const k in btns) {
          btns[k].style.background = (k === now) ? 'rgba(15,98,254,.55)' : 'rgba(255,255,255,.08)';
          btns[k].style.color = (k === now) ? '#fff' : '#cfd6d3';
        }
        setTimeout(fit, 120);
      });
      btns[name] = b;
      bar.appendChild(b);
    }
    const note = document.createElement('span');
    note.textContent = '決めたら use.sh で確定';
    note.style.cssText = 'color:#7f8b98;font-size:12px;margin-left:6px';
    bar.appendChild(note);
    document.body.appendChild(bar);
  }

  show(cur);
