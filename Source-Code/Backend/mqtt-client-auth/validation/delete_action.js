const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.user = !isEmpty(data.user) ? data.user : ""
    data.uid = !isEmpty(data.uid) ? data.uid : ""

    // User check
    if (Validator.isEmpty(data.user)) {
        errors.user = "User is required"
    }

    // UID check
    if (Validator.isEmpty(data.uid)) {
        errors.uid = "UID is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}