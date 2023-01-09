const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.userID = !isEmpty(data.userID) ? data.userID : ""
    data.username = !isEmpty(data.username) ? data.username : ""

    // User ID check
    if (Validator.isEmpty(data.userID)) {
        errors.userID = "User ID is required"
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