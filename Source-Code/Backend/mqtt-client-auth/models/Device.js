const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DeviceSchema = new Schema(
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
            unqiue: true
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
        client_uuid: {
            type: String,
            minlength: 36,
            required: true,
            trim: true
        },
        client_name: {
            type: String,
            required: true,
            trim: true
        },
        number: {
            type: Number,
            required: true
        },
        config_type: {
            type: String,
            required: true,
            enum: [
                "Generic Digital Output",
                "Generic Digital Input",
                "Generic Analog Output",
                "Generic Analog Input",
            ],
        }
    },
    {
        versionKey: false
    }
)

module.exports = Device = mongoose.model("mqtt_devices", DeviceSchema)