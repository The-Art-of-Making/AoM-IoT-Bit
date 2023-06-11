const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ServiceSchema = new Schema(
    {
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
    },
    {
        versionKey: false
    }
)

module.exports = Service = mongoose.model("mqtt_services", ServiceSchema)
