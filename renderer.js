const {ipcRenderer} = require('electron')

const titleView = document.querySelector('#titleView')
const messageView = document.querySelector('#messageView')
const updateView = document.querySelector('#updateView')
const progress = document.querySelector('.progress')
const bar = document.querySelector('.bar')

const logInfo = (message, container) => {
    const li = document.createElement('li')
    li.textContent = `${new Date().toLocaleString()} | ${message}`
    container.appendChild(li)
}

ipcRenderer.send('getPackage')
ipcRenderer.on('packInfo', (event, args) => {
    const {version, updateURL} = args
    console.log('packInfo', args)
    titleView.innerHTML = `print server ${version}`
    updateView.innerHTML = updateURL
})

ipcRenderer.send('checkForUpdates')
ipcRenderer.on('uploadMessage', (event, args) => {
    console.log(args)
    const {payload} = args
    const {msg, status} = payload
    logInfo(msg, messageView)
    const handle = {
        '-1': () => {
        },
        '0': () => {
            /*正在检测更新*/
        },
        '1': () => {
            ipcRenderer.send('downLoadUpdate')
            /* 发送下载请求 */
        },
        '2': () => {
            /*当前为最新版本*/
        },
        '3':() => {
        }
    }
    handle[`${status}`]()
})


ipcRenderer.on('downloadProgress', (event, data) => {
    const {percent} = data
    const percentage = Number.parseFloat((percent || 0).toFixed(2))
    const rate = `${percentage}%`
    progress.style.display = 'block'
    bar.style.width = rate
    bar.textContent = rate

    if (percent >= 100) {
        progress.style.display = 'none'
        logInfo('更新成功', messageView)
    }
})


