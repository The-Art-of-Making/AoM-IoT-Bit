const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.username = !isEmpty(data.username) ? data.username : ""
    data.password = !isEmpty(data.password) ? data.password : ""

    // User ID check
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username is required"
    }

    // Name check
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}