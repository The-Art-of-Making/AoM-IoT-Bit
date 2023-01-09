const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const express = require("express")
const Client = require("../../../models/Client")
const User = require("../../../models/User")
const Device = require("../../../models/Device")
const validateRegisterClient = require("../../../validation/register_client")
const validateDeleteClient = require("../../../validation/delete_client")

const router = express.Router()

const clientDevices = 2 // each client can only support 2 devices

const addDevices = (user, client_name, client_username) => {
    for (let deviceCount = 0; deviceCount < clientDevices; deviceCount++) {
        let newDevice = new Device({
            user: user,
            client_name: client_name,
            client_username: client_username,
            name: "Device " + deviceCount.toString(),
            number: deviceCount,
            io: "output",
            signal: "digital"
        })
        newDevice
            .save()
            .catch(err => {
                console.log(err)
                return false
            })
    }
    return true
}

const deleteDevices = (user, client_username) => {
    // TODO Modify associated actions
    Device.deleteMany({ user: user, client_username: client_username })
        .catch(err => {
            console.log(err)
            return false
        })
    return true
}

router.post("/register", (req, res) => {
    // Check validation
    const { errors, isValid } = validateRegisterClient(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    User.findOne({ _id: req.body.userID })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: "User " + req.body.userID + " does not exist" })
            }
            else {
                // TODO add two devices
                const newClient = new Client({
                    name: req.body.name,
                    user: user._id,
                    username: "client-" + crypto.randomUUID(),
                })
                if (!addDevices(newClient.user, newClient.name, newClient.username)) {
                    return res.status(500).json({ error: "Unable to add client devices" })
                }
                // Hash password before saving in database
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err
                    // Generate hex token
                    crypto.randomBytes(32, (err, buffer) => {
                        if (err) throw err
                        let token = buffer.toString("hex")
                        bcrypt.hash(token, salt, (err, hash) => {
                            if (err) throw err
                            newClient.password = hash
                            newClient
                                .save()
                                .then(() => {
                                    res.status(201).json({ username: newClient.username, password: token })
                                })
                                .catch(err => {
                                    console.log(err)
                                    return res.status(500).json({ error: err })
                                })
                        })

                    })
                })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err })
        })
})

router.post("/delete", (req, res) => {
    // Check validation
    const { errors, isValid } = validateDeleteClient(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    User.findOne({ _id: req.body.userID })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: "User " + req.body.userID + " does not exist" })
            }
            else {
                // Delete client devices
                Client
                    .findOne({ user: req.body.userID, username: req.body.username })
                    .then(client => {
                        if (!client) {
                            return res.status(404).json({ error: "Client " + req.body.username + " does not exist" })
                        } else {
                            if (!deleteDevices(req.body.userID, req.body.username)) {
                                return res.status(500).json({ error: "Failed to delete devices for client " + req.body.username })
                            }
                            // Delete client
                            Client
                                .deleteOne({ username: req.body.username })
                                .then(() => {
                                    // TODO delete device from actions when client is deleted
                                    return res.status(200).json({ message: "Successfully deleted client " + req.body.username })
                                })
                                .catch(err => {
                                    console.log(err)
                                    return res.status(500).json({ error: err })
                                })
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        return res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err })
        })
})

module.exports = router
