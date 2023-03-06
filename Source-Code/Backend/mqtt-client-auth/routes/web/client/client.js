const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const express = require("express")
const Client = require("../../../models/Client")
const User = require("../../../models/User")
const Device = require("../../../models/Device")
const Action = require("../../../models/Action")
const validateRegisterClient = require("../../../validation/register_client")
const validateDeleteClient = require("../../../validation/delete_client")
const validateAddAction = require("../../../validation/add_action")
const validateDeleteAction = require("../../../validation/delete_action")

const router = express.Router()

const clientDevices = 2 // each client can only support 2 devices

const addDevices = (user, client_name, client_username) => {
    for (let deviceCount = 0; deviceCount < clientDevices; deviceCount++) {
        let newDevice = new Device({
            user: user,
            uid: "device-" + crypto.randomUUID(),
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
    User.findOne({ _id: req.body.user })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: "User " + req.body.user + " does not exist" })
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
    User.findOne({ _id: req.body.user })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: "User " + req.body.user + " does not exist" })
            }
            else {
                // Delete client devices
                Client
                    .findOne({ user: req.body.user, username: req.body.username })
                    .then(client => {
                        if (!client) {
                            return res.status(404).json({ error: "Client " + req.body.username + " does not exist" })
                        } else {
                            if (!deleteDevices(req.body.user, req.body.username)) {
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

router.post("/add_action", (req, res) => {
    // Check validation
    const { errors, isValid } = validateAddAction(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const user = req.body.user
    const name = req.body.name
    const uid = "action-" + crypto.randomUUID()
    const triggerTopic = req.body.triggerTopic
    const triggerState = req.body.triggerState
    const deviceResponses = req.body.deviceResponses
    const deviceUIDs = Object.keys(req.body.deviceResponses)
    User
        .findOne({ _id: user })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ error: "User " + user + " does not exist" })
            }
            else {
                Device
                    .find({ user: user })
                    .then(devices => {
                        if (!devices) {
                            return res.status(404).json({ error: "Devices not found" })
                        }
                        for (let i = 0; i < deviceUIDs.length; i++) {
                            if (!devices.find(device => device.uid == deviceUIDs[i])) {
                                return res.status(404).json({ error: "Devices not found" })
                            }
                        }
                        for (const uid in deviceResponses) {
                            deviceResponses[uid] = parseInt(deviceResponses[uid], 10)
                        }
                        let newAction = new Action({
                            user: user,
                            name: name,
                            uid: uid,
                            trigger_topic: triggerTopic,
                            trigger_state: parseInt(triggerState, 10),
                            responses: new Map(Object.entries(deviceResponses))
                        })
                        newAction
                            .save()
                            .then(action => {
                                // TODO make request to update_config endpt
                                return res.status(200).json({ action: action })
                            })
                            .catch(err => {
                                return res.status(500).json({ error: err })
                            })
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
            }
        })
})

router.post("/delete_action", (req, res) => {
    // Check validation
    const { errors, isValid } = validateDeleteAction(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const user = req.body.user
    const uid = req.body.uid
    User
        .findOne({ _id: user })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ error: "User " + user + " does not exist" })
            }
            else {
                Action
                    .deleteMany({ uid: uid })
                    .then(() => {
                        // TODO make request to update_config endpt
                        return res.status(200).json({})
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

router.post("/get_server", (req, res) => {
    const user = req.body.user
    if (!user) {
        return res.status(400).json({ user: "User is required" })
    }
    User
        .findOne({ _id: user })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ error: "User " + user + " does not exist" })
            }
            else {
                Server
                    .findOne({ user: user })
                    .then(server => {
                        return res.status(200).json(server)
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

router.post("/get_clients", (req, res) => {
    const user = req.body.user
    if (!user) {
        return res.status(400).json({ user: "User is required" })
    }
    User
        .findOne({ _id: user })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ error: "User " + user + " does not exist" })
            }
            else {
                Client
                    .find({ user: user })
                    .then(clients => {
                        return res.status(200).json(clients)
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

router.post("/get_devices", (req, res) => {
    const user = req.body.user
    if (!user) {
        return res.status(400).json({ user: "User is required" })
    }
    User
        .findOne({ _id: user })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ error: "User " + user + " does not exist" })
            }
            else {
                Device
                    .find()
                    .then(devices => {
                        return res.status(200).json(devices)
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

module.exports = router
