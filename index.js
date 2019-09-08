const { 
  app, 
  BrowserWindow, 
  ipcMain,
  Menu,
  MenuItem,
} = require('electron');
const { fork } = require("child_process");

let baseUrl;
let mainWindow;
let mainUrl;
let createWindow;
let createUrl;

let processList = [];

if (process.env.NODE_ENV === 'DEV') {
  baseUrl = 'http://localhost:8080';
} else {
  baseUrl = `file://${__dirname}/dist/index.html`;
}

mainUrl = baseUrl;

if (process.env.NODE_ENV === 'DEV') {
  createUrl = baseUrl + "/#/create"
} else {
  createUrl = baseUrl + "#create"
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    minWidth: 1000,
    minHeight: 650,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    vibrancy: 'dark',
  });//创建一个窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  // mainWindow.setOpacity(0.98);
  mainWindow.loadURL(mainUrl);//在窗口内要展示的内容index.html 就是打包生成的index.html
  mainWindow.webContents.openDevTools();

  mainWindow.on('close', (event) => {
    if (mainWindow) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    // 回收BrowserWindow对象
    mainWindow = null;
    if (processList.length > 0) {
      for(let item of processList) {
        if (item.handler.connected) {
          item.handler.send({ action: "STOP", id: item.id });
        }
      }
      processList = [];
    }
  })

  mainWindow.on('show', () => {
    mainWindow.show();
  })
  
  mainWindow.on('enter-full-screen', () => {
    // 提示渲染进程进入全屏模式
    mainWindow.webContents.send('render-full-screen', 'ENTER_FULL_SCREEN');
  })

  mainWindow.on('leave-full-screen', () => {
    // 提示渲染进程退出全屏模式
    mainWindow.webContents.send('render-full-screen', 'LEAVE_FULL_SCREEN');
  })

}

// 创建“新建项目窗口”
function createCreateWindow({ action }) {
  Menu.setApplicationMenu(null);
  createWindow = new BrowserWindow({
    width: 500,
    height: 420,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    parent: mainWindow,
    resizable: false,
    movable: false,
    show: false,
    modal: true,
  });

  createWindow.once('ready-to-show', () => {
    createWindow.webContents.send('set-create-window-action', { action } );
    setTimeout(() => {
      createWindow.show();
    }, 500);
  });

  createWindow.loadURL(createUrl);
  // createWindow.webContents.openDevTools();

  createWindow.on('closed', () => {
    createWindow = null;
  })
}

function beforeCreateCreateWindow({ action }) {
  if (createWindow == null) {
    createCreateWindow({ action });
  }
}

// 应用配置
app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow == null) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
})


// 进程通信
// 显示创建窗口
ipcMain.on('show-create-window', (event, { action }) => {
  beforeCreateCreateWindow({ action });
});
// 关闭创建窗口
ipcMain.on('close-create-window', (event, arg) => {
  if (arg.action !== "CANCEL") {
    mainWindow.webContents.send('edit-task-list', { ...arg });
  }
  createWindow.close();
})

ipcMain.on('show-right-click-menu', (event, { id, status }) => {
  const menu = new Menu();
  menu.append(new MenuItem({ label: '开启连接', enabled: status !== "STARTED" }));
  menu.append(new MenuItem({ label: '关闭连接', enabled: status !== "STOPED" }));
  menu.append(new MenuItem({ label: '删除', click: () => {
    mainWindow.webContents.send('edit-task-list', { action: "DELETE", id });
  }}));

  menu.append(new MenuItem({ type: "separator" }));
  menu.append(new MenuItem({ label: '配置…', click: () => {
    beforeCreateCreateWindow({ action: "EDIT" });
  }}));

  const activatedWindow = BrowserWindow.fromWebContents(event.sender);

  menu.popup(activatedWindow);
})

ipcMain.on('start-ssh-task', (event, config) => {
  let { id } = config;
  let workerUrl;

  if (process.env.NODE_ENV === 'DEV') {
    workerUrl = './workers/Connection.js';
  } else {
    workerUrl = `${__dirname}/workers/Connection.js`;
  }

  let child = fork(workerUrl, [ JSON.stringify(config) ]);
  
  processList.push({ id, handler: child });

  child.on('message', (msg) => {
    if (msg.action && msg.action == "ERROR") {
      if (mainWindow !== null) {
        mainWindow.webContents.send('edit-task-list', { action: "STATUS", id, status: "STOPED" });
      }
    } else if (mainWindow !== null) {
      mainWindow.webContents.send('remote-ssh-results', msg);
    }
  })

})

ipcMain.on('stop-ssh-task', (event, config) => {
  let { id } = config;
  let idx = processList.findIndex((item) => item.id == id); 
  if (idx >= 0) {
    try {
      if (processList[idx].handler.connected) {
        processList[idx].handler.send({ action: "STOP", id });
      }
      processList.splice(idx, 1);
    } catch (error) {
      throw error;
    }
  }

})