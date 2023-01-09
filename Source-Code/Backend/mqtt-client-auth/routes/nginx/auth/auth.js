const bcrypt = require("bcryptjs")
const express = require("express")
const Server = require("../../../models/Server")
const Client = require("../../../models/Client")
const validateClient = require("../../../validation/client")

const router = express.Router()

router.get("/client", (req, res) => {
    // Check validation
    const { errors, isValid } = validateClient(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
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
            Server.findOne({ user: client.user }).then(server => {
                if (!server) {
                    return res.status(404).json({ error: "No server exists for client " + username })
                }
                return res.status(200).json({ server: server.addr + ":" + server.port })
            })
        })
    })
})

module.exports = router
