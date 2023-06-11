const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const express = require("express")
const Client = require("../../../models/Client")
const Service = require("../../../models/Service")
const User = require("../../../models/User")
const validateClient = require("../../../validation/client")

const router = express.Router()

// server should always return HTTP 200 OK
// allow/deny determined by request body

const verify_token = (token, token_hash) => {
    bcrypt.compare(token, token_hash).then(isMatch => {
        return isMatch
    })
}

const client_auth = (uuid, token) => {
    Client.findOne({ uuid: uuid }).then(client => {
        if (!client) {
            return false;
        }
        else {
            return verify_token(token, client.token)
        }
    })
}

const service_auth = (uuid, token) => {
    Service.findOne({ uuid: uuid }).then(service => {
        if (!service) {
            return false;
        }
        else {
            return verify_token(token, service.token)
        }
    })
}

const user_auth = id => {
    User.findOne({ _id: id }).then(user => {
        if (!user) {
            return false
        }
        else {
            return true
        }
    })
}

router.post("/user", (req, res) => {
    // Check validation
    const { errors, isValid } = validateClient(req.body)
    if (!isValid) {
        return res.status(200).send("deny")
    }
    const username = req.body.username
    const password = req.body.password
    if (client_auth(username, password)) {
        return res.status(200).send("allow")
    }
    else if (service_auth(username, password)) {
        return res.status(200).send("allow")
    }
    else if (user_auth(username)) {
        return res.status(200).send("allow")
    }
    else {
        return res.status(200).send("deny")
    }
})

// No vhost auth neede
router.post("/vhost", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const ip = req.body.ip
    return res.status(200).send("allow")
})

// No resource auth neede
router.post("/resource", (req, res) => {
    const username = req.body.username
    const vhost = req.body.vhost
    const resource = req.body.resource
    const name = req.body.name
    const permission = req.body.permission
    return res.status(200).send("allow")
})

// TODO topic-based authentication
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
