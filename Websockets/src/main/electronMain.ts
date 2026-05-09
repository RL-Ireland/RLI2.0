import path from "path";
import { app, BrowserWindow, Menu, Tray, Event } from "electron";
import { Bridge } from "./bridge";

let mainWindow: BrowserWindow | undefined;
let bridge: Bridge | undefined;
let tray: Tray | undefined;
let isQuitting = false;

function createWindow(): void {
  const iconPath = path.join(app.getAppPath(), "assets/icon.ico");
  mainWindow = new BrowserWindow({
    width: 900,
    height: 620,
    minWidth: 720,
    minHeight: 480,
    title: "RL to SOS Converter",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(app.getAppPath(), "src/renderer/index.html"));

  mainWindow.on("minimize" as any, (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  bridge = new Bridge();
  bridge.attachWindow(mainWindow);
  bridge.start();
}

function createTray(): void {
  tray = new Tray(path.join(app.getAppPath(), "assets/icon.ico"));
  tray.setToolTip("RL to SOS Converter");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        }
      },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createTray();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  bridge?.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('ready', () => {
  const iconPath = path.join(app.getAppPath(), "../images/rli_logo.ico");
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    },
    icon: iconPath,
    title: "Overlay Controller"
  });
  const win2 = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    },
    icon: iconPath,
    title: "Overlay Controller"
  });

  win.loadFile('..\\controller.html');
  win2.loadFile('..\\series_setup.html');
});
