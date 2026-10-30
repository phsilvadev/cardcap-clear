const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("cardapPrinter", {
  ready: () => ipcRenderer.invoke("printer:ready"),
  status: () => ipcRenderer.invoke("printer:status"),
  connect: (session) => ipcRenderer.invoke("printer:connect", session),
  disconnect: () => ipcRenderer.invoke("printer:disconnect"),
  configure: () => ipcRenderer.invoke("printer:configure"),
});
