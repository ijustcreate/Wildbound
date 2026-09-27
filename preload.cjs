const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  testMode: process.argv.includes("--wildbound-test"),
  restoreBackup: () => ipcRenderer.invoke("restore-backup"),
  loadHouseDesigns: () => ipcRenderer.invoke("house-designs-load"),
  saveHouseDesigns: (data) => ipcRenderer.invoke("house-designs-save", data),
  loadProfiles: () => ipcRenderer.invoke("profiles-load"),
  loadSession: () => ipcRenderer.invoke("session-load"),
  saveSession: (data) => ipcRenderer.invoke("session-save", data),
  saveProfiles: (data) => ipcRenderer.invoke("profiles-save", data),
  hostRoom: () => ipcRenderer.invoke("room-host"),
  joinRoom: (address, name) => ipcRenderer.invoke("room-join", address, name),
  stopRoom: () => ipcRenderer.invoke("room-stop"),
  sendRoom: (data) => ipcRenderer.send("room-send", data),
  onRoom: (fn) => ipcRenderer.on("room-event", (_e, data) => fn(data)),
  fullscreen: () => ipcRenderer.invoke("fullscreen"),
});
