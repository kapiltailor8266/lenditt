
const _ = require('lodash')

module.exports.filterAppointmentData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) { return [] }

    const response = []

    for (const elem of data) {
        let json = JSON.parse(JSON.stringify(elem))
        const student = this.separateKeysFromObj(json, 'student__')

        json.student = student

        const index = _.findIndex(response, ['id', json.id])

        if (index === -1) {
            response.push(json)
        }
    }
    return response
}


module.exports.separateKeysFromObj = (elem, identifier) => {
    const json = {}
    for (const singleKey of Object.keys(elem)) {
        if (singleKey && singleKey.startsWith(identifier)) {
            const value = elem[singleKey]
            if (value !== null && typeof value !== 'undefined') json[singleKey.replace(identifier, '')] = value
            delete elem[singleKey]
        }
    }
    return Object.keys(json).length > 0 ? json : undefined
}