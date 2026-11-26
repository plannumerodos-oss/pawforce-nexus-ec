/* PawForce Nexus EC - Biblioteca de ROMs + emulador (EmulatorJS) offline
   Uso: en index.html, justo antes de </body>:  <script src="roms.js"></script>
   Para jugar SIN internet: carpeta  emulatorjs/data/  junto a index.html */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const j = v => JSON.stringify(v).replace(/</g, '\\u003c');
  const toast = m => (window.alert ? window.alert(m) : console.log(m));

  // extensión -> núcleo (iso/bin/zip usan el selector de la tarjeta)
  const EXT = { cso: 'psp', pbp: 'psp', chd: 'psx', z64: 'n64', n64: 'n64', v64: 'n64', nds: 'nds',
                smc: 'snes', sfc: 'snes', gba: 'gba', gb: 'gb', gbc: 'gb', md: 'segaMD', gen: 'segaMD', nes: 'nes' };

  // ---------- Base de datos local (IndexedDB) ----------
  const dbp = new Promise((ok, no) => {
    const r = indexedDB.open('pf_roms', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('roms', { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await dbp;
    return new Promise((ok, no) => {
      const t = db.transaction('roms', mode);
      const q = fn(t.objectStore('roms'));
      t.oncomplete = () => ok(q && q.result);
      t.onerror = () => no(t.error);
    });
  };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

  // ---------- Tarjeta en la pestaña "Juegos 1-Clic & Steam" ----------
  const grid = document.querySelector('#tab-offline .grid');
  if (!grid) return;
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h4>📚 Mi Biblioteca de ROMs</h4>
    <p style="font-size:.78rem;color:#ccc;">Agrega tus juegos una vez: quedan guardados en este equipo y se abren en 1 clic, sin internet.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center;">
      <select id="pf-core-def" title="Sistema para archivos .iso / .bin / .zip">
        <option value="psp">.iso = PSP</option><option value="psx">.iso/.bin = PS1</option>
        <option value="n64">.zip = N64</option><option value="nds">.zip = NDS</option>
        <option value="snes">.zip = SNES</option><option value="gba">.zip = GBA</option>
      </select>
      <input type="file" id="pf-rom-add" multiple accept=".iso,.cso,.pbp,.chd,.bin,.z64,.n64,.v64,.nds,.smc,.sfc,.gba,.gb,.gbc,.md,.gen,.nes,.zip">
      <button id="pf-fs" style="padding:4px 10px;">⛶ Pantalla completa</button>
    </div>
    <div id="pf-rom-lib" style="max-height:220px;overflow:auto;"></div>`;
  grid.prepend(card);

  // ---------- Biblioteca ----------
  async function render() {
    const list = (await tx('readonly', s => s.getAll())) || [];
    const c = $('pf-rom-lib');
    if (!list.length) { c.innerHTML = '<p style="font-size:.78rem;color:#bbb;margin-top:6px;">Aún no hay juegos.</p>'; return; }
    c.innerHTML = list.map(r => `<div class="mod-item"><span>🎮 ${esc(r.name)} <small>(${esc(r.core)})</small></span>
      <div><button data-act="play" data-id="${r.id}" style="padding:2px 8px;font-size:.72rem;">▶ Jugar</button>
      <button data-act="del" data-id="${r.id}" style="padding:2px 6px;font-size:.72rem;background:#EF3340;">X</button></div></div>`).join('');
  }
  $('pf-rom-lib').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = Number(b.dataset.id);
    if (b.dataset.act === 'del') { await tx('readwrite', s => s.delete(id)); render(); return; }
    const r = await tx('readonly', s => s.get(id));
    if (r) run(r.blob, r.core, r.name);
  });
  $('pf-rom-add').addEventListener('change', async e => {
    const def = $('pf-core-def').value;
    for (const f of e.target.files) {
      const ext = f.name.split('.').pop().toLowerCase();
      await tx('readwrite', s => s.add({ name: f.name.replace(/\.[^.]+$/, ''), core: EXT[ext] || def, blob: f }));
    }
    e.target.value = '';
    render();
    toast('✅ Juegos agregados a tu biblioteca.');
  });
  $('pf-fs').addEventListener('click', () => { const f = $('pf-emu'); if (f && f.requestFullscreen) f.requestFullscreen(); });

  // ---------- Emulador ----------
  async function emuPath() {
    const local = new URL('emulatorjs/data/', location.href).href;
    try { const r = await fetch(local + 'loader.js', { method: 'HEAD' }); if (r.ok) return { p: local, off: true }; } catch (e) {}
    return { p: 'https://cdn.emulatorjs.org/stable/data/', off: false };
  }
  async function run(blob, core, name) {
    const { p, off } = await emuPath();
    $('game-canvas').style.display = 'none';
    $('instant-game-frame').style.display = 'none';
    const old = $('pf-emu');
    if (old) { URL.revokeObjectURL(old.dataset.u); old.remove(); }
    const url = URL.createObjectURL(blob);
    const fr = document.createElement('iframe');
    fr.id = 'pf-emu'; fr.dataset.u = url;
    fr.allow = 'gamepad; fullscreen; autoplay';
    fr.style.cssText = 'width:100%;height:100%;border:none;';
    fr.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="${location.href}">
      <style>html,body{margin:0;height:100%;background:#000}#g{width:100%;height:100%}</style></head>
      <body><div id="g"></div>
      <script>EJS_player='#g';EJS_core=${j(core)};EJS_gameName=${j(name)};EJS_gameUrl=${j(url)};EJS_pathtodata=${j(p)};EJS_startOnLoaded=true;<\/script>
      <script src="${p}loader.js"><\/script></body></html>`;
    $('emulator-container').appendChild(fr);
    if (!off) toast('Usando el emulador en línea. Para jugar sin internet agrega la carpeta emulatorjs/data');
  }

  // El botón "Cargar ROM" original también usa este emulador
  window.startEmulator = () => {
    const i = $('rom-input');
    if (!i.files.length) return toast('Selecciona primero un archivo ROM.');
    run(i.files[0], $('emu-core').value, i.files[0].name);
  };

  render();
})();
