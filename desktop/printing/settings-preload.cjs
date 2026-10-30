const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("printerSettings", {
  close: () => ipcRenderer.invoke("settings:close"),
  load: () => ipcRenderer.invoke("settings:load"),
  save: (value) => ipcRenderer.invoke("settings:save", value),
});
