const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.user = !isEmpty(data.user) ? data.user : ""
    data.name = !isEmpty(data.name) ? data.name : ""

    // User ID check
    if (Validator.isEmpty(data.user)) {
        errors.user = "User is required"
    }

    // Name check
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}