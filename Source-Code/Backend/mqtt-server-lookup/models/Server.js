const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ServerSchema = new Schema({
    user: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    uuid: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    addr: {
        type: Number,
        required: true
    },
    port: {
        type: Number,
        required: true
    },
    client_count: {
        type: Number,
        required: true
    }
})

module.exports = Server = mongoose.model("mqtt_servers", ServerSchema)
