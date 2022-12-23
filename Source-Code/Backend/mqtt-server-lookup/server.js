const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const lookup = require("./routes/api/lookup")
const db = process.env.MONGOURI || require("./config/keys").mongoURI

const server = express()

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

server.use("/api/", lookup)

const port = process.env.PORT || 5000

server.listen(port, () => console.log(`Server up and running on port ${port}!`))
