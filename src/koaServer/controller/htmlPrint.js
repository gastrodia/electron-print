const path = require('path')
const {BrowserWindow, app, ipcMain} = require('electron')

const isPrdEnv = process.env.NODE_ENV === 'production'
const staticPath = isPrdEnv ? './static' : '../../../static'

let printWindow = null
const url = `file://${path.resolve(__dirname, `${staticPath}/print.html`)}`

app.whenReady().then(() => {
    printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    printWindow.loadURL(url)
})

const htmlToPrint = (content, deviceName, margin) => {
    return new Promise((resolve, reject) => {
        if (!printWindow) return reject('请等待控件加载完成后重试')
        const htmlPrintingListener = () => {
            printWindow.webContents.print({
                silent: true,
                printBackground: false,
                deviceName
            }, (success, failureReason) => {
                ipcMain.removeListener('htmlPrinting', htmlPrintingListener)
                if (success) resolve(true)
                else reject('打印失败')
            })
        }

        printWindow.webContents.send('htmlPrint', { content, margin, deviceName })
        ipcMain.on('htmlPrinting', htmlPrintingListener)
    })
}

module.exports = htmlToPrint
