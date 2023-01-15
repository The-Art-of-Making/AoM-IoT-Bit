const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DeviceActionSchema = new Schema(
    {
        action: {
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
        response: {
            type: Number,
            required: true
        }
    },
    {
        versionKey: false
    }
)

const DeviceSchema = new Schema(
    {
        user: {
            type: String,
            required: true,
            trim: true
        },
        client_name: {
            type: String,
            required: true,
            trim: true
        },
        client_username: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        number: {
            type: Number,
            required: true
        },
        io: {
            type: String,
            required: true,
            enum: ["input", "output"]
        },
        signal: {
            type: String,
            required: true,
            enum: ["digital", "analog"]
        },
        actions: {
            type: Map,
            of: DeviceActionSchema,
            required: false
        }
    },
    {
        versionKey: false
    }
)

module.exports = Device = mongoose.model("mqtt_devices", DeviceSchema)
