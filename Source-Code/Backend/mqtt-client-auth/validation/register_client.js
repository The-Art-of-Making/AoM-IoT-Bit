const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.userID = !isEmpty(data.userID) ? data.userID : ""
    data.name = !isEmpty(data.name) ? data.name : ""

    // User ID check
    if (Validator.isEmpty(data.userID)) {
        errors.userID = "User ID is required"
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