/* PF-AI real: responde cualquier pregunta usando tu Worker (que guarda la clave de Gemini).
   Uso: en index.html, después de roms.js:  <script src="ai.js"></script> */
(() => {
  const AI_URL = 'https://pf-ai.plannumerodos.workers.dev';
  const $ = id => document.getElementById(id);
  const safe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hist = [];

  function add(html, color) {
    const box = $('ai-chat-box');
    const d = document.createElement('div');
    d.style.cssText = 'margin-bottom:6px;' + (color ? 'color:var(--ec-yellow);' : '');
    d.innerHTML = html;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d;
  }

  window.askAI = async function () {
    const input = $('ai-input');
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    add(`<strong>Tú:</strong> ${safe(q)}`);

    // Comandos de la app (se ejecutan directo)
    const low = q.toLowerCase();
    let local = null;
    if (/\b(escritorio|windows)\b/.test(low)) { openWin11(); local = 'Abriendo el Escritorio Virtual PawForce OS 11.'; }
    else if (/(limpiar|optimizar) ram/.test(low)) { cleanRAM(); local = 'Memoria RAM optimizada al 92%.'; }
    else if (/(activar|quitar|desactivar) (la )?mira|mira l[aá]ser/.test(low)) { toggleCrosshair(); local = 'Mira láser activada/desactivada.'; }
    else if (/poner radio|radio synthwave/.test(low)) { setPresetRadio('https://TU-STREAM-SYNTHWAVE/stream'); local = 'Poniendo Radio Synthwave Ecuador.'; }
    if (local) return add(`<strong>PF-AI:</strong> ${local}`, true);

    // Todo lo demás lo responde la IA
    if (AI_URL.startsWith('PEGA_AQUI')) return add('<strong>PF-AI:</strong> Falta configurar la URL del Worker en ai.js.', true);
    const wait = add('<strong>PF-AI:</strong> <em>escribiendo…</em>', true);
    hist.push({ role: 'user', text: q });
    let reply;
    try {
      const r = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: hist.slice(-12) })
      });
      reply = (await r.json()).reply || 'Sin respuesta.';
    } catch (e) {
      reply = 'No pude conectarme. Revisa tu internet o la URL del Worker.';
    }
    hist.push({ role: 'assistant', text: reply });
    wait.innerHTML = `<strong>PF-AI:</strong> ${safe(reply).replace(/\n/g, '<br>')}`;
    $('ai-chat-box').scrollTop = $('ai-chat-box').scrollHeight;
  };
})();
