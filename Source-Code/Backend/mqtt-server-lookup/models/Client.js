const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ClientSchema = new Schema({
    user: {
        type: String,
        required: true,
        trim: true
    },
    uuid: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    ip_addr: {
        type: String,
        trim: true
    }
})

module.exports = Client = mongoose.model("mqtt_clients", ClientSchema)
