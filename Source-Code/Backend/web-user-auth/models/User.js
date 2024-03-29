const mongoose = require("mongoose")
const Schema = mongoose.Schema

// Create Schema
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
)

module.exports = User = mongoose.model("web_users", UserSchema)
