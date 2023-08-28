const bcrypt = require("bcryptjs")
const express = require("express")
const url = require("url")
const Server = require("../../../models/Server")
const Client = require("../../../models/Client")
const User = require("../../../models/User")
const validateClient = require("../../../validation/client")

const router = express.Router()

router.get("/client", (req, res) => {
    const username = url.parse(req.url, true).query.username
    const password = url.parse(req.url, true).query.password
    const data = {
        username: username,
        password: password
    }
    // Check validation
    const { errors, isValid } = validateClient(data)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    Client.findOne({ username: username }).then(client => {
        if (!client) {
            User.findOne({ _id: username }).then(user => {
                if (!user) {
                    return res.status(403).json({ error: "Failed to authenticate user " + username })
                }
                else {
                    Server.findOne({ user: username }).then(server => {
                        if (!server) {
                            return res.status(404).json({ error: "No server exists for user " + username })
                        }
                        return res.status(200).json({ server: server.addr + ":" + server.wsPort })
                    })
                }
            })
        }
        else {
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
        }
    })
})

module.exports = router
