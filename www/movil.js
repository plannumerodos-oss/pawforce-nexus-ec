/* PawForce Nexus EC - Arreglos para Android / celular / web
   Uso: en index.html, después de los otros scripts:  <script src="movil.js"></script> */
(() => {
  const isElectron = /Electron/i.test(navigator.userAgent);

  // ---------- 1. Pantalla: que todo encaje en el celular ----------
  const css = `
    html,body{max-width:100vw;overflow-x:hidden}
    img,iframe,video,canvas{max-width:100%}
    @media (max-width:900px){
      header{flex-direction:column !important;align-items:stretch !important;gap:6px !important;padding:8px !important;height:auto !important}
      header .brand{flex-wrap:wrap;font-size:.9rem}
      .hud-bar{display:flex !important;flex-wrap:wrap;gap:4px 12px;font-size:.72rem}
      header > div:last-child{flex-wrap:wrap}
      #main-nav{display:flex !important;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch}
      #main-nav button{flex:0 0 auto}
      main{padding:8px !important}
      .grid{grid-template-columns:1fr !important}
      .viewport{height:60vh !important}
      #emulator-container{height:50vh !important}
      #ai-drawer{left:0 !important;right:0 !important;bottom:0 !important;width:100% !important;max-width:100% !important}
      #cabina-tv-pip{width:90vw !important;max-width:90vw !important;left:5vw !important;right:auto !important}
      .win-window{top:2% !important;left:2% !important;width:96% !important;height:90% !important}
      .win-icons{grid-template-columns:repeat(auto-fill,78px) !important;padding:12px !important}
      .modal-box{max-width:94vw !important}
      input,select,button,textarea{max-width:100%}
    }`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // Seguro: si la pantalla de bienvenida se queda pegada, la quita (si no, tapa todos los botones)
  setTimeout(() => { const s = document.getElementById('splash-screen'); if (s) s.remove(); }, 6000);

  // Steam solo existe en Windows: se oculta fuera del .exe
  if (!isElectron) {
    const b = document.querySelector('button[onclick="scanSteam()"]');
    const c = b && b.closest('.card');
    if (c) c.style.display = 'none';
  }

  // ---------- 2. Juegos y nube: fuera del .exe las páginas externas NO se pueden meter en un iframe ----------
  // (GeForce NOW, Xbox, Now.gg, etc. lo bloquean). Se abren en el navegador del teléfono.
  if (!isElectron) {
    const ext = u => window.open(u, '_blank', 'noopener');
    const same = u => { try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; } };

    window.loadCloud = u => ext(u);
    window.openWinApp = (t, u) => ext(u);
    window.openPipWeb = u => ext(u);

    window.loadInstantGame = u => {
      if (!u || u.includes('TU-JUEGO')) return alert('Este juego aún no tiene enlace.');
      if (!same(u)) return ext(u);              // juego externo: se abre en el navegador
      const emu = document.getElementById('pf-emu');
      if (emu) emu.remove();
      document.getElementById('game-canvas').style.display = 'none';
      const f = document.getElementById('instant-game-frame');
      f.style.display = 'block';
      f.src = u;                                // juego propio (juegos.html): dentro de la app
    };
  }
})();
