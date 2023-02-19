const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ActionSchema = new Schema(
    {
        user: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        uid: {
            type: String,
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