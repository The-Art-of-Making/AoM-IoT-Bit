const bcrypt = require("bcryptjs")
const express = require("express")
const Server = require("../../../models/Server")
const Client = require("../../../models/Client")

const router = express.Router()

// TODO validate username, password are not empty

router.get("/client", (req, res) => {
    const username = req.body.username
    const password = req.body.password
    Client.findOne({ username: username }).then(client => {
        if (!client) {
            return res.status(403).json({ error: "Failed to authenticate client " + username })
        }
        bcrypt.compare(password, client.password).then(isMatch => {
            if (!isMatch) {
                return res.status(403).json({ error: "Failed to authenticate client " + username })
            }
        })
        Server.findOne({ user: client.user }).then(server => {
            if (!server) {
                return res.status(404).json({ error: "No server exists for client " + username })
            }
            return res.status(200).json({ server: server.addr + ":" + server.port })
        })
    })
})

module.exports = router
