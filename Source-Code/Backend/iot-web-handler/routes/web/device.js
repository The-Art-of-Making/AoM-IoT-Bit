const express = require("express")
const User = require("../../models/User")
const Device = require("../../models/Device")
const validateUpdateDevice = require("../../validation/update_device")

const router = express.Router()

// Update a device
router.post("/update", (req, res) => {
    // Check validation
    const { errors, isValid } = validateUpdateDevice(req.body)
    if (!isValid) {
        return res.status(400).json(errors)
    }
    const name = req.body.name
    const uuid = req.body.uuid
    const io = req.body.io
    const signal = req.body.signal
    User.findOne({ _id: req.body.user_id })
        .then(user => {
            if (!user) {
                return res.status(404).json({ user_id: "User " + req.body.user_id + " does not exist" })
            }
            else {
                Device.findOne({ uuid: uuid })
                    .then(device => {
                        if (!device) {
                            return res.status(404).json({ uuid: "Device " + uuid + " does not exist" })
                        }
                        else {
                            device.name = name
                            device.io = io
                            device.signal = signal
                            device.save()
                                .then(updatedDevice => {
                                    return res.status(200).json(updatedDevice)
                                })
                                .catch(err => {
                                    return res.status(500).json({ error: err })
                                })
                        }
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

// Get all of a user's devices
router.post("/all", (req, res) => {
    const user_id = req.body.user_id
    if (!user_id) {
        return res.status(400).json({ user_id: "User is required" })
    }
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
