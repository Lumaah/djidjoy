'use strict';
const { app, BrowserWindow, Menu, shell, screen, Tray } = require('electron');
const path = require('path');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
let activeScreen;
if (isMac) {
  // TODO
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    { role: 'help' }
  ]));
} else {
  Menu.setApplicationMenu(null);
}

app.enableSandbox();

const createWindow = (windowOptions) => {
  console.log("create window")
  const options = {
    title: "Vs.Djidjoy v1.1",
    icon: path.resolve(__dirname, "icon.png"),
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    width: 480,
    height: 360,
    ...windowOptions,
  };

  activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const bounds = activeScreen.workArea;
  options.x = bounds.x + ((bounds.width - options.width) / 2);
  options.y = bounds.y + ((bounds.height - options.height) / 2);
  console.log("création")
  const window = new BrowserWindow(options);
  console.log("window créé")
  return window;
};

const createProjectWindow = () => {
  console.log("create project window")
  const windowMode = "maximize";
  const window = createWindow({
    backgroundColor: "#000000",
    width: 480,
    height: 408,
    minWidth: 50,
    minHeight: 50,
    
    fullscreen: windowMode === 'fullscreen',
  });
  window.loadFile(path.resolve(__dirname, './index.html'))
  .then(() => {
    console.log("loaded")
    window.show()
    window.focus()
    window.maximize()
  })
  window.setSize(activeScreen.workAreaSize.width, activeScreen.workAreaSize.height)
  /*window.on("ready-to-show", () => {
    setTimeout(() => {
      window.show()
      window.focus()
      window.maximize()
    }, 5000)
  })*/
};

const createDataWindow = (dataURI) => {
  console.log("create data window")
  const window = createWindow({});
  window.loadURL(dataURI);
};

const isSafeOpenExternal = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch (e) {
    // ignore
  }
  return false;
};

const isDataURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'data:';
  } catch (e) {
    // ignore
  }
  return false;
};

const openLink = (url) => {
  if (isSafeOpenExternal(url)) {
    shell.openExternal(url);
  } else if (isDataURL(url)) {
    createDataWindow(url);
  }
};

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler((details) => {
    setImmediate(() => {
      openLink(details.url);
    });
    return { action: 'deny' };
  });
  contents.on('will-navigate', (e, url) => {
    e.preventDefault();
    openLink(url);
  });
  contents.on('before-input-event', (e, input) => {
    const window = BrowserWindow.fromWebContents(contents);
    if (!window || input.type !== "keyDown") return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      window.setFullScreen(!window.isFullScreen());
    } else if (input.key === 'Escape' && window.isFullScreen()) {
      window.setFullScreen(false);
    }
  });
});

function createNotifyIcon() {
  let tray = new Tray(path.resolve(__dirname, "icon.png"))
  tray.setToolTip("Vs.Djidjoy v1.1")
  const menu = Menu.buildFromTemplate([
    {
      label: "Vs.Djidjoy v1.1",
      enabled: false,
      icon: path.resolve(__dirname, "iconReduced.png")
    },
    {
      type: "separator"
    },
    {
      label: 'Fermer le jeu',
      click: () => {
        app.quit()
      }
    }
  ]);
  tray.setContextMenu(menu);
  tray.setTitle("Vs.Djidjoy v1.1")
  tray.on("click", () => {
    tray.popUpContextMenu()
  })
  tray.displayBalloon({
    iconType: "info",
    title: "Le jeu se lance",
    content: "Le jeu se lance, il s'ouvrira dans quelques instants.",
  })
  setInterval(() => {
    console.log(tray.isDestroyed())
  }, 10000)
}

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {
  console.log("ready")
  createProjectWindow();
  createNotifyIcon()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createProjectWindow();
    }
  });
});