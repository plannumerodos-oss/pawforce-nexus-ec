const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Permite SharedArrayBuffer (núcleo PSP) y audio sin clic previo
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const ROOT = path.join(__dirname, 'www'); // la app vive en la carpeta www
const PORT = 38593; // puerto FIJO: así tu biblioteca de ROMs, PawCoins y mods no se pierden entre sesiones
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.zip': 'application/zip',
  '.7z': 'application/x-7z-compressed', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

// Servidor local: el emulador necesita http:// (con file:// el navegador bloquea sus archivos)
function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.normalize(path.join(ROOT, p));
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (err, data) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.on('error', () => srv.listen(0, '127.0.0.1', () => resolve(srv.address().port))); // si el puerto está ocupado
    srv.listen(PORT, '127.0.0.1', () => resolve(PORT));
  });
}

async function createWindow() {
  const port = await startServer();
  const win = new BrowserWindow({
    width: 1280, height: 800, backgroundColor: '#050811', autoHideMenuBar: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.loadURL(`http://127.0.0.1:${port}/`);
}

// ---- Steam local ----
const STEAM = 'C:\\Program Files (x86)\\Steam';
ipcMain.handle('scan-steam-games', async () => {
  const dir = path.join(STEAM, 'steamapps');
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.acf')).map(f => {
      const t = fs.readFileSync(path.join(dir, f), 'utf8');
      const m = t.match(/"name"\s+"([^"]+)"/);
      return { name: m ? m[1] : f };
    }).filter(g => !/Steamworks|Redistributable/i.test(g.name));
  } catch (e) { return []; }
});
ipcMain.on('launch-steam-offline', () => {
  try { spawn(path.join(STEAM, 'steam.exe'), ['-offline'], { detached: true, stdio: 'ignore' }).unref(); } catch (e) {}
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
