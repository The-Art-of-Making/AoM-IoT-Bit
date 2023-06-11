const crypto = require("crypto")
const express = require("express")
const User = require("../../models/User")
const Device = require("../../models/Device")
const Action = require("../../models/Action")
const validateAddAction = require("../../validation/add_action")
const validateDeleteAction = require("../../validation/delete_action")

const router = express.Router()

// Add a new action
router.post("/add", (req, res) => {
    // Check validation
    const { errors, isValid } = validateAddAction(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const user_id = req.body.user_id
    const name = req.body.name
    const uuid = "action-" + crypto.randomUUID()
    const trigger_topic = req.body.trigger_topic
    const trigger_state = req.body.trigger_state
    const device_responses = req.body.device_responses
    const deviceUUIDs = Object.keys(req.body.device_responses)
    User
        .findOne({ _id: user_id })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ user_id: "User " + user_id + " does not exist" })
            }
            else {
                Device
                    .find({ user_uuid: findUser.uuid })
                    .then(devices => {
                        if (!devices) {
                            return res.status(404).json({ devices: "Devices not found" })
                        }
                        for (let i = 0; i < deviceUUIDs.length; i++) {
                            if (!devices.find(device => device.uuid == deviceUUIDs[i])) {
                                return res.status(404).json({ devices: "Devices not found" })
                            }
                        }
                        for (const device_uuid in device_responses) {
                            device_responses[device_uuid] = parseInt(device_responses[device_uuid], 10)
                        }
                        let newAction = new Action({
                            name: name,
                            uuid: uuid,
                            user_uuid: findUser.uuid,
                            trigger_topic: trigger_topic,
                            trigger_state: parseInt(trigger_state, 10),
                            responses: new Map(Object.entries(device_responses))
                        })
                        newAction
                            .save()
                            .then(action => {
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

// Delete an action
router.post("/delete", (req, res) => {
    // Check validation
    const { errors, isValid } = validateDeleteAction(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const user_id = req.body.user_id
    const uuid = req.body.uuid
    User
        .findOne({ _id: user_id })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ user_id: "User " + user_id + " does not exist" })
            }
            else {
                Action
                    .deleteMany({ uuid: uuid })
                    .then(() => {
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

// Get all of a user's actions
router.post("/all", (req, res) => {
    const user_id = req.body.user_id
    if (!user_id) {
        return res.status(400).json({ user_id: "User ID is required" })
    }
    User
        .findOne({ _id: user_id })
        .then(findUser => {
            if (!findUser) {
                return res.status(404).json({ user_id: "User " + user_id + " does not exist" })
            }
            else {
                Action
                    .find({ user_uuid: findUser.uuid })
                    .then(actions => {
                        return res.status(200).json(actions)
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
