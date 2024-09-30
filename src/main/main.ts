/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const fs = require('fs');
// import knex from 'knex';
import createKnexConfig from './database/knexConfig';
import constants from './constants';
const { WIN_ROOT, WIN_SUB_FOLDER, DATABASE_NAME, WIN_PATH } = constants;
console.log({ WIN_ROOT, DATABASE_NAME, WIN_PATH });

import knex from 'knex';
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');
console.log({ RESOURCES_PATH });
// Get the path to the user's Documents folder
const documentsPath = app.getPath(WIN_ROOT as 'documents');
// Define the path for your app folder
const appFolderPath = path.join(documentsPath, WIN_SUB_FOLDER);
const dbFilePath = path.join(appFolderPath, DATABASE_NAME);
const migrationPath = RESOURCES_PATH + '/migrations';
// import Database from 'better-sqlite3';
// Create the knex configuration with the dynamic file path
const dbConfig = createKnexConfig(dbFilePath, migrationPath)['production'];

// Initialize knex with better-sqlite3
const db = knex(dbConfig);
// async function runMigrations() {
//   await db.schema.hasTable('users').then(async (exists) => {
//     if (!exists) {
//       return db.schema.createTable('users', (table) => {
//         table.increments('id').primary();
//         table.string('name');
//         table.string('email').unique();
//       });
//     }
//   });
// }
async function runMigrations() {
  try {
    await db.migrate.latest();
    console.log('Migrations have been run successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
  }
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
app.on('ready', async () => {
  console.log('PATHS', { appFolderPath, dbFilePath });
  // Check if the folder exists
  if (!fs.existsSync(appFolderPath)) {
    // Create the folder if it doesn't exist
    fs.mkdirSync(appFolderPath);
    console.log(`Folder created: ${DATABASE_NAME}`, appFolderPath);
  } else {
    console.log('Folder already exists:', appFolderPath);
  }

  // Check if the database file exists
  if (!fs.existsSync(dbFilePath)) {
    // Create a new SQLite database file
    fs.writeFileSync(dbFilePath, '');
  } else {
    console.log('Database already exists:', dbFilePath);
  }
  // RUN MIGRATIONS
  await runMigrations();
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// // Handle file read request from React
// ipcMain.handle('read-file', (event, filePath) => {
//   return fs.readFileSync(filePath, 'utf8'); // Reads the file synchronously and returns its content
// });
// Handle file selection and read
ipcMain.handle('select-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['config', 'json'] }],
  });

  if (filePaths && filePaths[0]) {
    const fileData = fs.readFileSync(filePaths[0], 'utf8');
    return fileData;
  }

  return null;
});

app
  .whenReady()
  .then(async () => {
    console.log('Launching Window');

    await createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
