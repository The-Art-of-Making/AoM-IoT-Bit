const express = require("express")
const url = require("url")
const Server = require("../../models/Server")
const Client = require("../../models/Client")

const router = express.Router()

router.get("/lookup", (req, res) => {
    const uuid = url.parse(req.url, true).query.uuid
    console.log(uuid)
    Client.findOne({ uuid: uuid }).then(client => {
        if (!client) {
            return res.status(404).json({ error: "Client with UUID " + uuid + " Not Found" })
        }
        Server.findOne({ user: client.user }).then(server => {
            if (!server) {
                return res.status(500).json({ error: "No server exists for client with UUID " + uuid })
            }
            return res.status(200).json({ server: server.addr + ":" + server.port })
        })
    })
})

module.exports = router
