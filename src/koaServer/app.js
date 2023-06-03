const bodyParser = require('koa-bodyparser')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const net = require('net')
const Koa = require('koa')
const cors = require('koa2-cors')
const portSecurity = require('../utils/portSecurity')

const printApi = require('./router/print')
const silentPrintApi = require('./router/silentPrint')

const isPrdEnv = process.env.NODE_ENV === "production"

const httpPort = 1006
const httpsPort = 1126

// 根据项目的路径导入生成的证书文件
const staticPath = isPrdEnv ? './static/cert' : '../../static/cert'
const privateKey = fs.readFileSync(path.join(__dirname, `${staticPath}/server.key`), 'utf8')
const certificate = fs.readFileSync(path.join(__dirname, `${staticPath}/server.crt`), 'utf8')

const credentials = {
    key: privateKey,
    cert: certificate
}
const createKoaServer = (mainWindow, port) => {
    const app = new Koa()
    // 设置头部信息
    app.use(cors())
    app.use(bodyParser())
    //使用路由中间件
    app.use(async (ctx, next) => {
        ctx.mainWindow = mainWindow
        await next()
    })

    app.use(printApi.routes()).use(printApi.allowedMethods())
    app.use(silentPrintApi.routes()).use(silentPrintApi.allowedMethods())
    // app.listen(port, () => {
    //     console.log(`http run ${port}`)
    // })
    portSecurity(httpPort, () => {
        // 创建http服务器实例
        const httpServer = http.createServer(app.callback()).listen(httpPort)
        portSecurity(httpsPort, () => {
            console.log(`创建http服务器实例`)
            // 创建https服务器实例
            const httpsServer = https.createServer(credentials, app.callback()).listen(httpsPort)
            const netServer = net.createServer(socket => {
                console.log(`创建https服务器实例`)
                socket.once('data', buffer => {
                    const [first] = buffer
                    // https数据流的第一位是十六进制“16”，转换成十进制就是22
                    const address = first === 22 ? httpsPort : httpPort
                    // 创建一个指向https或http服务器的链接
                    const proxy = net.createConnection({ port: address }, () => {
                        proxy.write(buffer);
                        // 反向代理的过程，tcp接受的数据交给代理链接，代理链接服务器端返回数据交由socket返回给客户端
                        socket.pipe(proxy).pipe(socket)
                    })
                    proxy.on('error', error => log.error(`proxy | ${error}`))
                })
                socket.on('error', error => log.error(`socket | ${error}`))
            }).listen(port, () => {
                console.log('Print app http or https at 3000 port')
            })
        })
    })
}


module.exports = createKoaServer
