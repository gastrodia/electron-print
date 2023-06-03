const Router = require('koa-router');
const router = new Router({prefix: '/print'})
const {SuccessModel} = require('../model/resultModel')

router.get('/printer', async (ctx, next) => {
    const {mainWindow} = ctx
    const printsList = mainWindow.webContents.getPrinters()
    const v = printsList.filter((element) => element.status === 0)
    log.info('获取打印列表成功')
    ctx.body = new SuccessModel(v, '成功')
    await next()
})

module.exports =  router
