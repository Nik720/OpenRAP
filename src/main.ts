import { bootstrap, framework } from './index';
import  { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: any;
let envs = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json'), { encoding: 'utf-8' }));
_.forEach(envs, function (value, key) {
  process.env[key] = value;
});

function createWindow() {
  //bootstrap container
  bootstrap();

  //bootstrap framework
  framework(()=> {
    win.loadURL('http://localhost:9000');
  });

  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false
    }
  });
  win.maximize();

  // Open the DevTools.
  //win.webContents.openDevTools();

  win.focus();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
