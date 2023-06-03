const {app, BrowserWindow, Menu, ipcMain} = require('electron')
const path = require('path')
const updateHandle = require('./src/utils/update')

const portSecurity = require('./src/utils/portSecurity')
const createKoaServer = require('./src/koaServer/app')


const {version} = require('./package.json')
const updateURL = 'http://127.0.0.1:5000'


const port = 9697
const log = require('./src/utils/log')
global.log = log

Menu.setApplicationMenu(null)

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 563,
        useContentSize: true,
        width: 1000,
        show: true,
        title: 'print',
        icon: 'static/icons/icon.ico',
        webPreferences: {webSecurity: false, nodeIntegration: true, contextIsolation: false}
    })

    // mainWindow.webContents.openDevTools()

    mainWindow.loadFile('index.html').then()
    updateHandle(mainWindow, updateURL)

    portSecurity(port, () => {
        createKoaServer(mainWindow, port)
    })

    ipcMain.on('getPackage', event => {
        mainWindow.webContents.send('packInfo', {
            updateURL,
            version
        })
    })
}


app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (!BrowserWindow.getAllWindows().length) createWindow()
    })
})


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
