const { app, BrowserWindow, ipcMain} = require('electron');
const path = require("path")
const {doJSModification} = require("./intercept");

app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--enable-webgl2-compute-context');
app.commandLine.appendSwitch('--lang', 'en-US');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--force-discrete-gpu', '1');
app.commandLine.appendSwitch('--enable-high-resolution-time');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--ignore-gpu-blacklist');
app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: "WebSocket Mod",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  

  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL("https://tetr.io");

  

  // block enthusiast gaming ad network
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders({
      urls: ["*://*.enthusiastgaming.net/*"]
  }, (details, callback) => {
      callback({cancel: true});
  });


  //edit tetrio.js
  if (mainWindow.webContents.session.protocol.isProtocolHandled("multistream")) {
      mainWindow.webContents.session.protocol.unhandle("multistream");
  }

  mainWindow.webContents.session.protocol.handle("multistream", async () => {

    const tetriojs = await fetch("https://tetr.io/js/tetrio.js");
      const text = await tetriojs.text();
      const newtext = await doJSModification(text);

      

      return new Response(newtext, {
          headers: {
              "Content-Type": "application/javascript"
          }
      })
  });

  mainWindow.webContents.session.webRequest.onBeforeRequest({
      urls: ["*://*.tetr.io/js/tetrio.js*"]
  }, (details, callback) => {
      callback({redirectURL: "multistream://tetrio.js"});
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.on("send-message", (event, msg) => {
  console.log("send")
  console.log(msg)
})

ipcMain.on("receive-message", (event, msg) => {
  console.log("receive")
  console.log(msg)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
