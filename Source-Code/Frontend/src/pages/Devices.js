import { Component, createRef } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import { toast } from "react-toastify"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import { iotWebHandlerEndpts } from "../endpoints"
import MQTTClient from "../components/MQTTClient"
import { clientTopicBuilder, clientTopics, deviceTopicBuidler, deviceTopics } from "../components/TopicBuilder"
import DeviceCard from "../components/DeviceCards/DeviceCard"
import GenericDigitalDeviceCard from "../components/DeviceCards/GenericDigitalDeviceCard"
import GenericAnalogDeviceCard from "../components/DeviceCards/GenericAnalogDeviceCard"
import { Subscriber, Broker } from "../components/PubSub"

class Devices extends Component {

    broker = new Broker()

    state = {
        devices: [],
        errors: {},
        connected: false,
        reconnectTimeout: 1500,
        refs: {},
        subscribers: {}
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    messageHandler = message => {
        this.broker.publish(message.destinationName, message.payloadBytes)
    }

    componentDidMount() {
        this.mqttClient = new MQTTClient(this.props.auth.user.id, "password", [], this.setConnected, this.messageHandler)
        this.getDevices()
        this.mqttClient.connect()
        this.intervalID = setTimeout(this.connectToServer.bind(this), this.state.reconnectTimeout)
    }

    componentWillUnmount() {
        clearTimeout(this.intervalID)
        this.mqttClient.disconnect()
    }

    setConnected = () => {
        this.setState({
            connected: true
        })
    }

    connectToServer = () => {
        this.mqttClient.connect()
        if (!this.mqttClient.connected) {
            this.setState({
                reconnectTimeout: this.state.reconnectTimeout * 2
            })
            toast.error("Failed to connect to server")
            this.intervalID = setTimeout(this.connectToServer.bind(this), this.state.reconnectTimeout)
        }
        else {
            this.setState({
                reconnectTimeout: 5000
            })
            toast.success("Connected to server")
        }
    }

    getDevices = () => {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/device/all", reqData)
            .then(res => {
                this.setState({
                    devices: res.data
                })
                res.data.forEach(device => {
                    const stateTopic = deviceTopicBuidler(device.user_uuid, device.client_uuid, device.uuid, deviceTopics.state)
                    const statusTopic = clientTopicBuilder(device.user_uuid, device.client_uuid, clientTopics.status)

                    let updatedRefs = this.state.refs
                    updatedRefs[device.uuid] = createRef()
                    this.setState({
                        refs: updatedRefs
                    })

                    let updateSubscribers = this.state.subscribers
                    updateSubscribers[device.uuid] = new Subscriber((topic, data) => updatedRefs[device.uuid].current.handleMsg(data))
                    this.setState({
                        subscribers: updateSubscribers
                    }, () => {
                        this.broker.subscribe(this.state.subscribers[device.uuid], stateTopic)
                        this.broker.subscribe(this.state.subscribers[device.uuid], statusTopic)
                        this.mqttClient.subscribe(stateTopic)
                        this.mqttClient.subscribe(statusTopic)
                    })
                })
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get devices")
            })
    }

    editDevice = (uuid, name, user_uuid, client_uuid, config_type) => {
        const updateDevice = { user_id: this.props.auth.user.id, uuid: uuid, name: name, config_type: config_type }
        axios
            .post(iotWebHandlerEndpts + "/web/device/update", updateDevice)
            .then(() => {
                const topic = clientTopicBuilder(user_uuid, client_uuid, clientTopics.config)
                // this.mqttClient.publish(topic, 1)
                // TODO publish device config directly?
                this.getDevices()
                toast.success("Successfully edited device")
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to edit device")
            })
    }

    render() {
        const disabledStyle = !this.state.connected ? { backgroundColor: "black", filter: "alpha(opacity=30)", opacity: 0.3 } : {}
        return (
            <div className="d-flex">
                <Sidebar currentItem="Devices" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-left p-1 gap-1" style={disabledStyle}>
                            {
                                this.state.devices.map(device => {
                                    let deviceCard = <DeviceCard
                                        key={device.uuid}
                                        ref={this.state.refs[device.uuid]}
                                        device={device}
                                        editDevice={this.editDevice}
                                        publish={this.mqttClient.publish}
                                        serverConnected={this.state.connected}
                                        initialDeviceState={0}
                                        io="output"
                                    />
                                    switch (device.config_type) {
                                        case "Generic Digital Output":
                                            deviceCard = <GenericDigitalDeviceCard
                                                key={device.uuid}
                                                ref={this.state.refs[device.uuid]}
                                                device={device}
                                                editDevice={this.editDevice}
                                                publish={this.mqttClient.publish}
                                                serverConnected={this.state.connected}
                                                initialDeviceState={0}
                                                io="output"
                                            />
                                            break
                                        case "Generic Digital Input":
                                            deviceCard = <GenericDigitalDeviceCard
                                                key={device.uuid}
                                                ref={this.state.refs[device.uuid]}
                                                device={device}
                                                editDevice={this.editDevice}
                                                publish={this.mqttClient.publish}
                                                serverConnected={this.state.connected}
                                                initialDeviceState={0}
                                                io="input"
                                            />
                                            break
                                        case "Generic Analog Output":
                                            deviceCard = deviceCard = <GenericAnalogDeviceCard
                                                key={device.uuid}
                                                ref={this.state.refs[device.uuid]}
                                                device={device}
                                                editDevice={this.editDevice}
                                                publish={this.mqttClient.publish}
                                                serverConnected={this.state.connected}
                                                initialDeviceState={0}
                                                io="output"
                                            />
                                            break
                                        case "Generic Analog Input":
                                            deviceCard = <GenericAnalogDeviceCard
                                                key={device.uuid}
                                                ref={this.state.refs[device.uuid]}
                                                device={device}
                                                editDevice={this.editDevice}
                                                publish={this.mqttClient.publish}
                                                serverConnected={this.state.connected}
                                                initialDeviceState={0}
                                                io="input"
                                            />
                                            break
                                        default:
                                            break
                                    }
                                    return (
                                        deviceCard
                                    )
                                }

                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

Devices.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
})
export default connect(
    mapStateToProps,
    { logoutUser }
)(Devices)
