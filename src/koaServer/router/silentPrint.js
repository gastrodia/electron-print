const Router = require('koa-router')
const router = new Router({prefix: '/print'})

const pdfToPrint = require('../controller/pdfPrint')
const htmlToPrint = require('../controller/htmlPrint')

const {awaitWrapper} = require('../utils')
const {SuccessModel, ErrorModel} = require('../model/resultModel')


const handle = {
    pdf: () => pdfToPrint,
    html: () => htmlToPrint
}

const types = Object.keys(handle)

/*
* 打印
* @type
* @content
* */
router.post('/silentPrint', async (ctx, next) => {
    const {request, mainWindow} = ctx
    const {content, deviceName, marginTop = '0cm', marginLeft = '0cm'} = request.body

    let {type = '', pcs = 1} = request.body
    type = type.toLowerCase()
    pcs = Number.parseInt(pcs)
    if (Number.isNaN(pcs)) pcs = 1

    const printList = mainWindow.webContents.getPrinters()

    if (!types.includes(type)) {
        ctx.body = new ErrorModel(`type只能为${types.join(',')}`)
        return
    }

    if (!content) {
        ctx.body = new ErrorModel(`打印内容不能为空`)
        return
    }


    /* 校验打印机是否有效 */
    let printValid = true
    if (deviceName) {
        const valid = printList.find(v => v.name === deviceName && !v.status)
        if (!valid) {
            printValid = false
            ctx.body = new ErrorModel(`【${deviceName}】打印机不可用`)
        }
    } else {
        printValid = false
        ctx.body = new ErrorModel(`打印机不能为空`)
    }

    if (!printValid) return

    if (pcs > 1) {
        const bus = []
        for (let i = 0; i < pcs; i++) {
            bus.push(handle[type]()(content, deviceName, {top: marginTop, left: marginLeft}))
        }

        const [pcsPrintError] = await awaitWrapper(Promise.all(bus))
        console.log(pcsPrintError)
        if (pcsPrintError) return ctx.body = new ErrorModel(pcsPrintError)
        return ctx.body = new SuccessModel('打印成功')
    }

    const [error] = await awaitWrapper(handle[type]()(content, deviceName, {top: marginTop, left: marginLeft}))
    if (error) {
        log.error(`【${deviceName}】 | ${error} | ${type} | ${content}`)
        ctx.body = new ErrorModel(error)
    } else {
        log.info(`【${deviceName}】 | 成功 | ${type} | ${content}`)
        ctx.body = new SuccessModel('打印成功')
    }
})

module.exports = router

