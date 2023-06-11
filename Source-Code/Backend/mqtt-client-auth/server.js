const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const mqtt_auth = require("./routes/mqtt/auth/auth")
const db = process.env.MONGOURI || require("./config/keys").mongoURI

const server = express()
server.use(cors())

mongoose
    .connect(
        db,
        // { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err))

server.use(
    bodyParser.urlencoded({
        extended: false
    })
)

server.use(bodyParser.json())

server.use("/mqtt/auth/", mqtt_auth)

const port = process.env.PORT || 5000

server.listen(port, () => console.log(`mqtt-client-auth up and running on port ${port}!`))
