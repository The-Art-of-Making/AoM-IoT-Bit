const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ServerSchema = new Schema(
    {
        user: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
        },
        status: {
            type: String,
            required: true,
            enum: ["WAITING", "STARTING", "RUNNING", "SHUTTING DOWN", "SHUTDOWN", "ERROR"],
            default: "SHUTDOWN"
        },
        uid: {
            type: String,
            unique: true,
            trim: true
        },
        addr: {
            type: String,
        },
        port: {
            type: Number,
        },
        client_count: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        versionKey: false
    }
)

module.exports = Server = mongoose.model("mqtt_servers", ServerSchema)
