const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.uuid = !isEmpty(data.uuid) ? data.uuid : ""
    data.user_id = !isEmpty(data.user_id) ? data.user_id : ""

    // UUID check
    if (Validator.isEmpty(data.uuid)) {
        errors.uuid = "UUID is required"
    }

    // User ID check
    if (Validator.isEmpty(data.user_id)) {
        errors.user_id = "User ID is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}