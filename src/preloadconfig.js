const {contextBridge, ipcRenderer} = require("electron/renderer");

contextBridge.exposeInMainWorld("config", {
    toggleUI: (isHidden) => ipcRenderer.send("toggle-ui", isHidden),
    toggleTransparent: (isTransparent) => ipcRenderer.send("toggle-transparent", isTransparent)
})