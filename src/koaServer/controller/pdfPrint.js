const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const cp = require('child_process')

const isPrdEnv = process.env.NODE_ENV === 'production'
const staticPath = isPrdEnv ? './static' : '../../../static'

const {awaitWrapper, randomString} = require('../utils')
/*
* 获取网络pdf的buffer
* */
const getFileBuffer = url => {
    const [protocol] = url.split(':')
    const request = protocol === 'https' ? https : http
    return new Promise(((resolve, reject) => {
        request.get(url, response => {
            const chunks = []
            let size = 0
            response.on('data', chunk => {
                chunks.push(chunk)
                size += chunk.length
            })
            response.on('end', () => {
                const buffer = Buffer.concat(chunks, size)
                resolve(buffer)
            })
        }).on('error', _ => {
            log.error(`pdf 链接无效 | ${url}`)
            reject('请求打印文件失败')
        })
    }))
}

/*
* 将buffer保存为本地临时文件
* */
const savePdf = buffer => {
    return new Promise((resolve, reject) => {
        const pdfUrl = path.resolve(__dirname, `${staticPath}/${randomString()}.pdf`)
        fs.writeFile(pdfUrl, buffer, {encoding: 'utf8'}, err => {
            if (err) {
                reject('缓存pdf打印文件失败')
            } else {
                resolve(pdfUrl)
            }
        })
    })
}


/*
* 调用SumatraPDF 执行pdf打印
* */
const executePrint = (pdfPath, deviceName, url) => {
    return new Promise((resolve, reject) => {
        cp.exec(`SumatraPDF.exe -print-to "${deviceName}"  "${pdfPath}"`,
            {
                windowsHide: true,
                cwd: path.resolve(__dirname, staticPath)
            },
            e => {
                if (e) {
                    reject(`${url}在${deviceName}上打印失败`)
                } else {
                    resolve(true)
                }
                /* 打印完成后删除创建的临时文件 */
                fs.unlink(pdfPath, Function.prototype)
            })
    })
}

/*
* 静默打印pdf
* */
const pdfToPrint = (url, deviceName) => {
    return new Promise(async (resolve, reject) => {
        /* 根据url获取buffer并返回，如果获取失败就直接reject */
        const [bufferError, buffer] = await awaitWrapper(getFileBuffer(url))
        if (bufferError) return reject(buffer || '获取网络pdf文件信息失败')
        /* 根据buffer将文件缓存到本地并返回临时pdf文件路径，如果存储失败就直接reject */
        const [pdfPathError, pdfPath] = await awaitWrapper(savePdf(buffer))
        if (pdfPathError) return reject(pdfPathError)
        /* 根据临时pdf文件路径 和打印机名称来执行打印*/
        const [execPrintError, printResult] = await awaitWrapper(executePrint(pdfPath, deviceName, url))
        if (execPrintError) {
            reject(execPrintError)
        } else {
            resolve(printResult)
        }
    })
}

module.exports = pdfToPrint
