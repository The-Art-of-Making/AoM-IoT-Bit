const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.name = !isEmpty(data.name) ? data.name : ""
    data.uuid = !isEmpty(data.uuid) ? data.uuid : ""
    data.user_id = !isEmpty(data.user_id) ? data.user_id : ""
    data.config_type = !isEmpty(data.config_type) ? data.config_type : ""

    // Name check
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name is required"
    }

    // UUID check
    if (Validator.isEmpty(data.uuid)) {
        errors.uuid = "UUID is required"
    }

    // User ID check
    if (Validator.isEmpty(data.user_id)) {
        errors.user_id = "User ID is required"
    }

    // Config Type check
    if (Validator.isEmpty(data.config_type)) {
        errors.config_type = "Configuration is required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}