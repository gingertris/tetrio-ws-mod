const {contextBridge, ipcRenderer} = require("electron/renderer");

contextBridge.exposeInMainWorld("config", {
    getConfig: key => ipcRenderer.send("get-config", key),
    setConfig: (key, value) => ipcRenderer.send("set-config", (key, value))
})