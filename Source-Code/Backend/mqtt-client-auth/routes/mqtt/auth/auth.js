const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const express = require("express")
const Client = require("../../../models/Client")
const Controller = require("../../../models/Controller")
const User = require("../../../models/User")
const validateClient = require("../../../validation/client")

const router = express.Router()

// server should always return HTTP 200 OK
// allow/deny determined by request body

router.post("/user", (req, res) => {
    // Check validation
    const { errors, isValid } = validateClient(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const username = req.body.username
    const password = req.body.password
    Client.findOne({ username: username }).then(client => {
        if (!client) {
            Controller.findOne({ username: username }).then(controller => {
                if (!controller) {
                    User.findOne({ _id: username }).then(user => {
                        if (!user) {
                            return res.status(200).send("deny")
                        }
                        else {
                            return res.status(200).send("allow")
                        }
                    })
                }
                else {
                    const password_hash = crypto.createHash("sha256").update(password).digest("hex")
                    if (password_hash !== controller.password) {
                        return res.status(200).send("deny")
                    }
                    return res.status(200).send("allow")
                }
            })
        }
        else {
            bcrypt.compare(password, client.password).then(isMatch => {
                if (!isMatch) {
                    return res.status(200).send("deny")
                }
                return res.status(200).send("allow")
            })
        }
    })
})

// TODO check requests from rabbitmq for the following
// TODO validate username, password, etc. are not empty

router.post("/vhost", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const ip = req.body.ip
    return res.status(200).send("allow")
})

router.post("/resource", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const resource = req.body.resource
    const name = req.body.name
    const permission = req.body.permission
    return res.status(200).send("allow")
})

router.post("/topic", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const resource = req.body.resource
    const name = req.body.name
    const permission = req.body.permission
    const routing_key = req.body.routing_key
    return res.status(200).send("allow")
})

module.exports = router
