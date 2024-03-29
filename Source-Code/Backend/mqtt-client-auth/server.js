const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const mqtt_auth = require("./routes/mqtt/auth/auth")
const nginx_auth = require("./routes/nginx/auth/auth")
const rabbitmq_auth = require("./routes/rabbitmq/auth/auth")
const web_client = require("./routes/web/client/client")
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
server.use("/nginx/auth/", nginx_auth)
server.use("/rabbitmq/auth", rabbitmq_auth)
server.use("/web/client/", web_client)

const port = process.env.PORT || 5000

server.listen(port, () => console.log(`Server up and running on port ${port}!`))
