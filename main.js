const { app, BrowserWindow, session, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

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

  mainWindow.loadFile(path.join(__dirname, 'www', 'index.html'));

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
