/**
 * 判断端口号是否被占用，占用的话直接杀死
 * @Param mainWindow electron窗口上下文
 * @Param port 端口号
 * */

const {exec} = require('child_process')
const portSecurity = (port, callback) => {
    const cmd = `netstat -ano|findstr ${port}`
    exec(cmd, (error, stdout, stderr) => {
        /* 查看端口是否被占用， stdout 有值则说明占用了*/
        // console.log(1, error) // null
        // console.log(2, stdout) // => 2 '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       23732\r\n'
        if (!error && stdout) { // 已存在端口
            let pid = null
            stdout.trim().split(/[\n|\r]/).forEach(item => {
                if (item.indexOf('LISTEN') !== -1 && !pid) {
                    pid = item.split(/\s+/).pop()
                }
            })
            if (!pid) {
                console.log(`端口${port}未被占用`)
                callback && callback()
            } else {
                // 然后拿到端口id 就是上面的23732
                console.log(`存在冲突端口:${port},pid为${pid}`)
                exec(`taskkill /pid ${pid} -t -f`, (error, stdout) => { // 直接杀死
                    console.log(`冲突端口:${port},pid为${pid}已被关闭`)
                    callback && callback()
                })
            }
        } else {
            console.log(`端口${port}未被占用,继续进行`)
            callback && callback()
        }
    })
}

module.exports = portSecurity
