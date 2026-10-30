const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const os = require("node:os");
const { createCloudConsumer } = require("./cloud-consumer.cjs");
const { pathToFileURL } = require("node:url");
const { receiptHtml, validateJob, trustedUrl } = require("./receipt.cjs");
let panel;
let startup;
let startupTimer;
let startupComplete = false;
let startupError = false;
let loadCycle = 0;
let settings;
let config;
let journal;
let printQueue;
let consumer;
let queueTimer;
const { createPrintQueue } = require("./queue.cjs");
const configFile = () => path.join(app.getPath("userData"), "printer.json");
const journalFile = () => path.join(app.getPath("userData"), "print-jobs.json");
const read = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
function save(file, data) {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(data), { mode: 0o600 });
  fs.renameSync(temporary, file);
}
function authorizePanel(event) {
  if (
    !panel ||
    event.sender !== panel.webContents ||
    event.senderFrame !== panel.webContents.mainFrame ||
    new URL(event.senderFrame.url).origin !== trustedUrl(config.url).origin
  )
    throw new Error("Acesso negado.");
}
function authorizeSettings(event) {
  if (
    !settings ||
    event.sender !== settings.webContents ||
    event.senderFrame !== settings.webContents.mainFrame ||
    event.senderFrame.url !==
      pathToFileURL(path.join(__dirname, "settings.html")).href
  )
    throw new Error("Acesso negado.");
}
function authorizeStartup(event) {
  if (
    !startup ||
    event.sender !== startup.webContents ||
    event.senderFrame !== startup.webContents.mainFrame ||
    event.senderFrame.url !==
      pathToFileURL(path.join(__dirname, "splash.html")).href
  )
    throw new Error("Acesso negado.");
}
function showStartup() {
  startupComplete = false;
  startupError = false;
  startup = new BrowserWindow({
    width: 460,
    height: 390,
    resizable: false,
    title: "Cardap Impressão",
    backgroundColor: "#ffffff",
    frame: true,
    closable: true,
    webPreferences: {
      preload: path.join(__dirname, "splash-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  startup.webContents.on("did-finish-load", () => startupState(startupError));
  startup.removeMenu();
  startup.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  startup.webContents.on("will-navigate", (event) => event.preventDefault());
  startup.on("closed", () => {
    startup = null;
    if (!startupComplete) app.quit();
  });
  void startup.loadFile(path.join(__dirname, "splash.html"));
}
function startupState(error) {
  startupError = error;
  if (startup && !startup.isDestroyed())
    startup.webContents.send("startup:state", { error });
}
function revealPanel() {
  if (!panel || panel.isDestroyed()) return;
  startupComplete = true;
  clearTimeout(startupTimer);
  panel.show();
  panel.focus();
  if (startup && !startup.isDestroyed()) startup.close();
}
function loadPanel() {
  const cycle = ++loadCycle;
  if (startup && !startup.isDestroyed()) {
    startupState(false);
    clearTimeout(startupTimer);
    startupTimer = setTimeout(() => startupState(true), 30000);
  }
  void panel.loadURL(config.url).catch((error) => {
    if (cycle !== loadCycle || error.code === "ERR_ABORTED") return;
    if (startup && !startup.isDestroyed()) startupState(true);
    else
      dialog.showErrorBox(
        "Painel indisponível",
        "Confira o endereço em Impressão → Configurar impressora e se o servidor está ligado.",
      );
  });
}
function createPanel() {
  panel = new BrowserWindow({
    show: false,
    backgroundColor: "#ffffff",
    width: 1380,
    height: 900,
    title: "Cardap Impressão",
    frame: true,
    titleBarStyle: "default",
    closable: true,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  panel.webContents.on(
    "did-start-navigation",
    (_event, _url, _inPlace, mainFrame) => {
      if (mainFrame) consumer?.disconnect();
    },
  );
  panel.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  panel.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== trustedUrl(config.url).origin)
      event.preventDefault();
  });
  panel.webContents.on("will-redirect", (event, url) => {
    if (new URL(url).origin !== trustedUrl(config.url).origin)
      event.preventDefault();
  });
  panel.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  panel.on("closed", () => {
    consumer?.disconnect();
    clearTimeout(startupTimer);
    panel = null;
    if (startup && !startup.isDestroyed()) startup.close();
    if (settings && !settings.isDestroyed()) settings.close();
  });
  showStartup();
  loadPanel();
}
function openSettings() {
  if (settings && !settings.isDestroyed()) {
    settings.focus();
    return;
  }
  settings = new BrowserWindow({
    parent: startup && !startup.isDestroyed() ? startup : panel,
    width: 540,
    height: 640,
    resizable: false,
    title: "Configurar impressora",
    frame: true,
    titleBarStyle: "default",
    closable: true,
    webPreferences: {
      preload: path.join(__dirname, "settings-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  settings.removeMenu();
  settings.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  settings.webContents.on("will-navigate", (event) => event.preventDefault());
  settings.on("closed", () => {
    settings = null;
  });
  void settings.loadFile(path.join(__dirname, "settings.html"));
}
async function printJob(input) {
  const job = validateJob(input);
  if (!config.printer)
    throw new Error("Configure a impressora antes de imprimir.");
  if (
    !(await panel.webContents.getPrintersAsync()).some(
      (printer) => printer.name === config.printer,
    )
  )
    throw new Error("A impressora configurada não está disponível.");
  const printer = config.printer;
  const width = config.width;
  const paper = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      javascript: false,
    },
  });
  try {
    await paper.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml(job, width))}`,
    );
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              "Tempo de impressão excedido. Confira a impressora antes de reenviar.",
            ),
          ),
        30000,
      );
      paper.webContents.print(
        {
          silent: true,
          deviceName: printer,
          printBackground: false,
          color: false,
          margins: { marginType: "none" },
          usePrinterDefaultPageSize: true,
        },
        (success, reason) => {
          clearTimeout(timeout);
          success
            ? resolve()
            : reject(new Error(reason || "Falha ao imprimir."));
        },
      );
    });
  } finally {
    if (!paper.isDestroyed()) paper.destroy();
  }
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (panel) {
      if (panel.isMinimized()) panel.restore();
      panel.focus();
    }
  });
  app.whenReady().then(() => {
    config = read(configFile(), {
      url:
        process.env.CARDAP_PANEL_URL ||
        "http://localhost:3001/dashboard/pedidos",
      printer: "",
      width: 80,
    });
    try {
      trustedUrl(config.url);
    } catch {
      config.url = "http://localhost:3001/dashboard/pedidos";
    }
    journal = read(journalFile(), {});
    if (!journal || typeof journal !== "object" || Array.isArray(journal))
      journal = {};
    printQueue = createPrintQueue({
      journal,
      save: (value) => save(journalFile(), value),
      print: printJob,
      confirmRetry: async (job) => {
        const answer = await dialog.showMessageBox(panel, {
          type: "warning",
          title: "Reenviar comanda",
          message: `Reenviar pedido #${job.order.id}?`,
          detail:
            "Confira a impressora antes de continuar. A tentativa anterior pode já ter impresso e o reenvio pode gerar uma segunda via.",
          buttons: ["Manter na fila de falhas", "Reenviar"],
          defaultId: 0,
          cancelId: 0,
        });
        return answer.response === 1;
      },
    });
    const deviceFile = path.join(app.getPath("userData"), "device-id.json");
    let deviceId = read(deviceFile, null);
    if (
      typeof deviceId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(deviceId)
    ) {
      deviceId = randomUUID();
      save(deviceFile, deviceId);
    }
    const inflightFile = path.join(
      app.getPath("userData"),
      "cloud-inflight.json",
    );
    consumer = createCloudConsumer({
      deviceId,
      deviceName: os.hostname().slice(0, 100),
      configured: () => Boolean(config.printer),
      submitted: (key) => journal[key] === "submitted",
      print: (payload) => printQueue(payload),
      loadInflight: () => {
        const value = read(inflightFile, {});
        return value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {};
      },
      saveInflight: (value) => save(inflightFile, value),
      call: async (session, action, fields) => {
        const response = await fetch(
          "https://southamerica-east1-cardap-e0bf0.cloudfunctions.net/tenantOrderOperations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.idToken}`,
            },
            body: JSON.stringify({
              data: { ...fields, storeId: session.storeId, action },
            }),
            signal: AbortSignal.timeout(15000),
          },
        );
        const result = await response.json();
        if (!response.ok || result.error) {
          const error = new Error("Falha no serviço de impressão.");
          error.code = String(result.error?.status || "unavailable")
            .toLowerCase()
            .replaceAll("_", "-");
          throw error;
        }
        return result.result ?? result.data;
      },
    });
    queueTimer = setInterval(() => {
      void consumer.tick();
    }, 3000);
    ipcMain.handle("startup:retry", (event) => {
      authorizeStartup(event);
      loadPanel();
    });
    ipcMain.handle("startup:configure", (event) => {
      authorizeStartup(event);
      openSettings();
    });
    ipcMain.handle("startup:quit", (event) => {
      authorizeStartup(event);
      app.quit();
    });
    ipcMain.handle("printer:ready", (event) => {
      authorizePanel(event);
      revealPanel();
    });
    ipcMain.handle("printer:status", (event) => {
      authorizePanel(event);
      return {
        configured: Boolean(config.printer),
        name: config.printer,
        ...consumer.status(),
      };
    });
    ipcMain.handle("printer:connect", async (event, session) => {
      authorizePanel(event);
      await consumer.connect(session);
    });
    ipcMain.handle("printer:disconnect", (event) => {
      authorizePanel(event);
      consumer.disconnect();
    });
    ipcMain.handle("printer:configure", (event) => {
      authorizePanel(event);
      openSettings();
    });
    ipcMain.handle("settings:close", (event) => {
      authorizeSettings(event);
      settings.close();
    });
    ipcMain.handle("settings:load", async (event) => {
      authorizeSettings(event);
      return { config, printers: await panel.webContents.getPrintersAsync() };
    });
    ipcMain.handle("settings:save", async (event, value) => {
      authorizeSettings(event);
      const url = trustedUrl(value.url);
      if (
        ![58, 80].includes(value.width) ||
        !(await panel.webContents.getPrintersAsync()).some(
          (printer) => printer.name === value.printer,
        )
      )
        throw new Error(
          "Selecione uma impressora instalada e a largura do papel.",
        );
      if (config.url !== url.href) {
        const result = await dialog.showMessageBox(settings, {
          type: "question",
          message: `Abrir o painel em ${url.origin}?`,
          detail:
            "Use apenas o endereço da plataforma Cardap. Esse site poderá solicitar a impressão de comandas.",
          buttons: ["Cancelar", "Confirmar endereço"],
          defaultId: 0,
          cancelId: 0,
        });
        if (result.response !== 1) return;
      }
      const changed = config.url !== url.href;
      config = { url: url.href, printer: value.printer, width: value.width };
      save(configFile(), config);
      settings.close();
      if (changed || startup) loadPanel();
    });
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "Impressão",
          submenu: [
            { label: "Configurar impressora", click: openSettings },
            { role: "reload", label: "Recarregar painel" },
            { type: "separator" },
            {
              role: "close",
              label: "Fechar janela",
              accelerator: "CmdOrCtrl+W",
            },
            { role: "quit", label: "Sair do aplicativo" },
          ],
        },
        { role: "editMenu", label: "Editar" },
        { role: "viewMenu", label: "Exibir" },
      ]),
    );
    createPanel();
    app.on("activate", () => {
      if (!panel) createPanel();
    });
  });
  app.on("before-quit", () => {
    startupComplete = true;
    clearTimeout(startupTimer);
    clearInterval(queueTimer);
    consumer?.disconnect();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
