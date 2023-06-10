const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.user = !isEmpty(data.user) ? data.user : ""
    data.uid = !isEmpty(data.uid) ? data.uid : ""
    data.name = !isEmpty(data.name) ? data.name : ""
    data.io = !isEmpty(data.io) ? data.io : ""
    data.signal = !isEmpty(data.signal) ? data.signal : ""

    // User ID check
    if (Validator.isEmpty(data.user)) {
        errors.user = "User is required"
    }

    // UID check
    if (Validator.isEmpty(data.uid)) {
        errors.uid = "UID is required"
    }

    // Name check
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name is required"
    }

    // IO check
    if (Validator.isEmpty(data.io)) {
        errors.io = "IO is required"
    }

    // Signal check
    if (Validator.isEmpty(data.signal)) {
        errors.signal = "Signal is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}