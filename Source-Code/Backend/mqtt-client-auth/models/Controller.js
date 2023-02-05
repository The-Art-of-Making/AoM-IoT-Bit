const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ControllerSchema = new Schema(
    {
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
        }
    },
    {
        versionKey: false
    }
)

module.exports = Controller = mongoose.model("mqtt_controllers", ControllerSchema)
