const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.user = !isEmpty(data.user) ? data.user : ""
    data.username = !isEmpty(data.username) ? data.username : ""

    // User check
    if (Validator.isEmpty(data.user)) {
        errors.user = "User is required"
    }

    // Username check
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}