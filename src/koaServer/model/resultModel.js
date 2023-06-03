/*
* @data 为返回的数据
* @message 为返回的提示信息
* */
class BaseModel {
    constructor(data, message) {
        // 兼容只传入message
        if (typeof data === 'string') {
            this.message = data
            message = null
            data = null
        }

        if (data) this.data = data

        if (message) this.message = message
    }
}

class SuccessModel extends BaseModel {
    constructor(data, message) {
        super(data, message)
        this.result = true
    }
}

class ErrorModel extends BaseModel {
    constructor(data, message) {
        super(data, message)
        this.result = false
    }
}

module.exports = {
    SuccessModel,
    ErrorModel
}
