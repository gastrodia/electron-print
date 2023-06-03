const awaitWrapper = promise => {
    return promise.then(result => [null, result]).catch(error => [error, null])
}

const randomString = () => {
    return Math.random().toString(36).slice(-6)
}

module.exports = {
    awaitWrapper,
    randomString
}
