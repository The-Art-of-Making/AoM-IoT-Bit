import { mqttServer } from '../endpoints'

const Paho = window.Paho

export default class MQTTClient {
    constructor(username, password, topics = [], onConnectCallback = () => { }, onMessageArrivedCallback = message => { }) {
        this.username = username
        this.password = password
        this.client = new Paho.MQTT.Client(mqttServer + "?username=" + this.username + "&password=" + this.password, this.username)
        this.client.onConnectionLost = this.onConnectionLost
        this.client.onMessageArrived = this.onMessageArrived
        this.connected = false
        this.reconnect = false
        this.topics = topics
        this.onConnectCallback = onConnectCallback
        this.onMessageArrivedCallback = onMessageArrivedCallback
    }

    connect = () => {
        if (!this.connected) {
            this.client.connect({
                onSuccess: this.onConnect,
                userName: this.username,
                password: this.password
            })
            this.reconnect = true
        }
    }

    disconnect = () => {
        console.log("Disconnecting")
        this.reconnect = false
        if (this.connected) {
            this.client.disconnect()
            this.connected = false
        }
    }

    onConnect = () => {
        console.log("Connected")
        this.connected = true
        this.topics.forEach(topic => this.subscribe(topic))
        this.onConnectCallback()
    }

    onMessageArrived = message => {
        this.onMessageArrivedCallback(message)
    }

    onConnectionLost = responseObject => {
        this.connected = false
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
        if (this.reconnect) {
            this.connect()
        }
    }

    subscribe = topic => {
        this.topics.push(topic)
        if (this.connected) {
            this.client.subscribe(topic)
        }
    }

    publish = (topic, msg, qos, retain) => {
        let message = new Paho.MQTT.Message(msg)
        message.destinationName = topic
        message.qos = qos
        message.retained = retain
        if (this.connected) {
            this.client.send(message)
        }
    }

}