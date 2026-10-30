const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("cardapStartup", {
  retry: () => ipcRenderer.invoke("startup:retry"),
  configure: () => ipcRenderer.invoke("startup:configure"),
  quit: () => ipcRenderer.invoke("startup:quit"),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("startup:state", listener);
    return () => ipcRenderer.removeListener("startup:state", listener);
  },
});
