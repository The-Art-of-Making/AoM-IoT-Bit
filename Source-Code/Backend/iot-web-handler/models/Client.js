const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ClientSchema = new Schema(
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
            unique: true,
            trim: true
        },
        token: {
            type: String,
            required: true,
            trim: true
        },
        user_uuid: {
            type: String,
            minlength: 36,
            required: true,
            trim: true
        },
        lan_ip: {
            type: String,
            trim: true
        },
        wan_ip: {
            type: String,
            trim: true
        }
    },
    {
        versionKey: false
    }
)

module.exports = Client = mongoose.model("mqtt_clients", ClientSchema)
