const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const action = require("./routes/web/action")
const client = require("./routes/web/client")
const device = require("./routes/web/device")
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

server.use("/web/action/", action)
server.use("/web/client/", client)
server.use("/web/device/", device)

const port = process.env.PORT || 5001

server.listen(port, () => console.log(`iot-web-handler up and running on port ${port}!`))
