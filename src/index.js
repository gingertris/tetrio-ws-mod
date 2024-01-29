const { app, BrowserWindow, ipcMain} = require('electron');
const path = require("path");
const util = require('util');

const {doJSModification} = require("./lib/intercept");

const RibbonHandler = require('./lib/ribbonhandler');
const ribbonHandler = new RibbonHandler();

let mainWindow;
let cssKey;

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

const createWindows = () => {
  // Create the browser window.
  createMainWindow();
  createConfigWindow();


}

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: "WebSocket Mod",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    transparent:true
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

const createConfigWindow = () => {
  const configWindow = new BrowserWindow({
    width:600,
    height:800,
    title: "WebSocket Mod Config",
    webPreferences: {
      preload: path.join(__dirname, 'preloadconfig.js')
    }
  });

  configWindow.setMenu(null);
  configWindow.webContents.loadFile(path.join(__dirname, "config.html"));

}

const receiveMessage = (msg) => {
  //if(!msg.command.includes("replay") && msg.command.includes("game")) console.log(msg.command);
  ribbonHandler.handleMessage(msg);
}

ipcMain.on("send-message", (event, msg) => {
  //console.log("send")
  //console.log(msg)
})

ipcMain.on("toggle-ui", (event, isHidden) => {
  console.log(`toggle-ui - ${isHidden}`)
  if(isHidden){
    hideUI()
  } else{
    showUI()
  }
})

ipcMain.on("toggle-transparent", (event, isTransparent) => {

})

const hideUI = async () => {
  cssKey = await mainWindow.webContents.insertCSS(`
    div {
      display: none;
    }
  `)
}

const showUI = () => {
  mainWindow.webContents.removeInsertedCSS(cssKey);
}

ipcMain.on("receive-message", (event, msg) => {
  
  if(msg.command == "X-MUL"){
    for(let message of msg.items){
      receiveMessage(message);
    }
  }
  else{
    receiveMessage(msg);
  }

});

//websocket server
const ws = require("ws");

const wss = new ws.WebSocketServer({
    port:31462
});

wss.on('connection', ws => {
  console.log("client connected");
  ws.send(JSON.stringify({
    event: "game:match_state",
    data: ribbonHandler.game.match
  }));
})

wss.on("error", (error) => {
  console.log(error)
})

const broadcast = (event, data = null) => {
  for (let client of wss.clients){
    if (client.readyState === ws.WebSocket.OPEN) client.send(JSON.stringify({
      event, data
    }));
  }
}

ribbonHandler.on("game:start", () => {
  broadcast("game:start")
})
ribbonHandler.on("game:advance",  () => {
  broadcast("game:advance");
  //console.log(util.inspect(leaderboard, true, null, true));
})
ribbonHandler.on("game:score_transition", (msg) => {
  broadcast("game:score_transition", msg)
})
ribbonHandler.on("game:match_state", msg => {
  //console.log(msg)
  broadcast("game:match_state", msg);
  //console.log(util.inspect(referee, true, null, true));
})
ribbonHandler.on("game:end", () => {
  broadcast("game:end")
})




// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindows);

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
    createWindows();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
