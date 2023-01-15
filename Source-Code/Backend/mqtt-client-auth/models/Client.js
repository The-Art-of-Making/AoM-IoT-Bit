const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ClientSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        user: {
            type: String,
            required: true,
            trim: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            trim: true
        },
        ip_addr: {
            type: String,
            trim: true
        }
    },
    {
        versionKey: false
    }
)

module.exports = Client = mongoose.model("mqtt_clients", ClientSchema)
