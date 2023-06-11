const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ActionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        uuid: {
            type: String,
            minlength: 36,
            required: true,
            trim: true,
            unique: true
        },
        user_uuid: {
            type: String,
            minlength: 36,
            required: true,
            trim: true
        },
        trigger_topic: {
            type: String,
            required: true
        },
        trigger_state: {
            type: Number,
            required: true
        },
        responses: {
            type: Map,
            of: Number,
            required: true
        }
    },
    {
        versionKey: false
    }
)

module.exports = Action = mongoose.model("actions", ActionSchema)