const { app, BrowserWindow, session, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

// ---- Servidor local: el emulador de ROMs necesita http:// (con file:// falla) ----
// Puerto FIJO para que tu biblioteca de ROMs, PawCoins y mods no se pierdan entre sesiones
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const http = require('http');
const ROOT = path.join(__dirname, 'www');
const PORT = 38593;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.zip': 'application/zip',
  '.7z': 'application/x-7z-compressed', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: 'PawForce Nexus EC',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: false
    }
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    callback({ cancel: false, responseHeaders });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('geforcenow') || url.includes('xbox') || url.includes('playstation') || url.includes('google')) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });

  startServer().then(port => mainWindow.loadURL(`http://127.0.0.1:${port}/`));

  globalShortcut.register('Alt+H', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    else mainWindow.minimize();
  });
}

ipcMain.handle('scan-steam-games', async () => {
  const steamPaths = [
    'C:\\Program Files (x86)\\Steam\\steamapps\\common',
    'D:\\SteamLibrary\\steamapps\\common',
    'E:\\SteamLibrary\\steamapps\\common'
  ];
  let foundGames = [];
  for (const dir of steamPaths) {
    if (fs.existsSync(dir)) {
      const folders = fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'Steamworks Shared')
        .map(d => ({ name: d.name, path: path.join(dir, d.name) }));
      foundGames = foundGames.concat(folders);
    }
  }
  return foundGames;
});

ipcMain.on('launch-steam-offline', () => {
  exec('"C:\\Program Files (x86)\\Steam\\steam.exe" -offline');
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});
