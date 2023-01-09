const bcrypt = require("bcryptjs")
const express = require("express")
const Server = require("../../../models/Server")
const Client = require("../../../models/Client")

const router = express.Router()

// server should always return HTTP 200 OK
// allow/deny determined by body message

// TODO validate username, password, etc. are not empty

router.post("/user", (req, res) => {
    const username = req.body.username
    const password = req.body.password
    Client.findOne({ uuid: username }).then(client => {
        if (!client) {
            return res.status(200).send({ deny: "" }) // deny
        }
        bcrypt.compare(password, client.password).then(isMatch => {
            if (!isMatch) {
                return res.status(200).json({ deny: "" }) // deny
            }
            return res.status(200).json({ allow: "" }) // allow
        })
    })
})

router.post("/vhost", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const ip = req.body.ip
})

router.post("/resource", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const resource = req.body.resource
    const name = req.body.name
    const permission = req.body.permission
})

router.post("/topic", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const resource = req.body.resource
    const name = req.body.name
    const permission = req.body.permission
    const routing_key = req.body.routing_key
})

module.exports = router
