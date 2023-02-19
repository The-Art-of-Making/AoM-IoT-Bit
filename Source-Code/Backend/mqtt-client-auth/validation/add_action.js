const Validator = require("validator")
const isEmpty = require("is-empty")

module.exports = function validateClient(data) {
    let errors = {}

    // Convert empty fields to an empty string to use validator functions
    data.user = !isEmpty(data.user) ? data.user : ""
    data.name = !isEmpty(data.name) ? data.name : ""
    data.triggerTopic = !isEmpty(data.triggerTopic) ? data.triggerTopic : ""
    data.triggerState = !isEmpty(data.triggerState) ? data.triggerState : ""

    // User ID check
    if (Validator.isEmpty(data.user)) {
        errors.user = "User is required"
    }

    // Name check
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name is required"
    }

    // Trigger topic check
    if (Validator.isEmpty(data.triggerTopic)) {
        errors.triggerTopic = "Trigger topic is required"
    }

    // Trigger state check
    if (Validator.isEmpty(data.triggerState)) {
        errors.triggerState = "Trigger state is required"
    }

    // Device-response check
    if (!data.deviceResponses) {
        errors.deviceResponses = "Device responses required"
    } else if (!Object.keys((data.deviceResponses)).length > 0) {
        errors.deviceResponses = "Device responses required"
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}