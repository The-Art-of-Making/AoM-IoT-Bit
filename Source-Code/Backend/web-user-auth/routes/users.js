const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const keys = require("../config/keys")

// Load input validation
const validateRegisterInput = require("../validation/register")
const validateLoginInput = require("../validation/login")
const validateAccountInput = require("../validation/account")

// Load User models
const User = require("../models/User")

router.post("/register", (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body)
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors)
  }
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "User with email already exists" })
    }
    else {
      const newUser = new User({
        email: req.body.email,
        password: req.body.password,
        uuid: "user-" + crypto.randomUUID()
      })
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err
          newUser.password = hash
          newUser
            .save()
            .then(user => {
              return res.status(201).json(user)
            })
            .catch(err => {
              return res.status(500).json({ serverError: "Server failed to update.", error: err })
            })
        })
      })
    }
  })
})

router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body)

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors)
  }
  const email = req.body.email
  const password = req.body.password

  // Find user by email
  User.findOne({ email: email }).then(user => {

    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailPasswordIncorrect: "Incorrect Email or Password" })
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user._id,
          email: user.email
        }
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 86400 // 24 hrs in seconds
          },
          (err, token) => {
            res.status(200).json({
              success: true,
              token: "Bearer " + token
            })
          }
        )
      } else {
        return res
          .status(400)
          .json({ emailPasswordIncorrect: "Incorrect Email or Password" })
      }
    })
  })
})

router.post("/update", (req, res) => {
  // query db for existing user, then update user doc with save() 
  User.findOne({ _id: req.body.id }).then(user => {
    if (user) {
      // Form validation
      const { errors, isValid } = validateAccountInput(req.body)
      // Check validation
      if (!isValid) {
        return res.status(400).json(errors)
      }
      // use id to check current user info and compare
      User.findOne({ email: req.body.email }).then(userEmail => {
        if (userEmail) {
          return res.status(400).json({ email: "User with email already exists" })
        }
        else {
          if (req.body.email.length > 0) {
            user.email = req.body.email
          }
          saveAccountInfo = () => {
            user.save()
              .then(user => {
                if (user) {
                  const payload = {
                    id: user._id,
                    email: user.email
                  }
                  // Sign token
                  jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                      expiresIn: 86400 // 24 hrs in seconds
                    },
                    (err, token) => {
                      res.status(200).json({
                        success: true,
                        token: "Bearer " + token
                      })
                    }
                  )
                }
                else {
                  return res.status(404).json({ accountNotFound: "Account Not Found" })
                }
              })
              .catch(err => {
                return res.status(500).json({ serverError: "Server failed to update.", error: err })
              })
          }
          if (req.body.password.length > 7) {
            // Hash password before saving in database
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (err) throw err
                user.password = hash
                saveAccountInfo()
              })
            })
          } else {
            saveAccountInfo()
          }
        }
      })
    }
    else {
      return res.status(404).json({ account: "Account Not Found" })
    }
  })
})

// TODO method for deleting account

module.exports = router
