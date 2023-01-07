const express = require("express")
const mongoose = require("mongoose")
const passport = require("passport")

const users = require("./routes/users")

const app = express()

// Bodyparser middleware
const bodyParser = require("body-parser")
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(bodyParser.json())

// DB Config
const db = require("./config/keys").mongoURI

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err))

// Passport middleware
app.use(passport.initialize())
// Passport config
require("./config/passport")(passport)
// Routes
app.use("/web_users/", users)

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server up and running on port ${port}!`))
