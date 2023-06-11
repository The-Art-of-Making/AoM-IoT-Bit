const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.name = !isEmpty(data.name) ? data.name : ""
    data.user_id = !isEmpty(data.user_id) ? data.user_id : ""
    data.trigger_topic = !isEmpty(data.trigger_topic) ? data.trigger_topic : ""
    data.trigger_state = !isEmpty(data.trigger_state) ? data.trigger_state : ""

    // Name check
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name is required"
    }

    // User ID check
    if (Validator.isEmpty(data.user_id)) {
        errors.user_id = "User ID is required"
    }

    // Trigger topic check
    if (Validator.isEmpty(data.trigger_topic)) {
        errors.trigger_topic = "Trigger device is required"
    }

    // Trigger state check
    if (Validator.isEmpty(data.trigger_state)) {
        errors.trigger_state = "Trigger state is required"
    }

    // Device-response check
    if (!data.device_responses) {
        errors.device_responses = "Device responses required"
    } else if (!Object.keys((data.device_responses)).length > 0) {
        errors.device_responses = "Device responses required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}