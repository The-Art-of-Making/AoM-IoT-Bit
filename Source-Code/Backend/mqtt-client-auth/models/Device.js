const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DeviceSchema = new Schema(
    {
        user: {
            type: String,
            required: true,
            trim: true
        },
        uid: {
            type: String,
            required: true,
            trim: true,
            unqiue: true
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
        }
    },
    {
        versionKey: false
    }
)

module.exports = Device = mongoose.model("mqtt_devices", DeviceSchema)