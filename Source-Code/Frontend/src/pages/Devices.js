import { Component, createRef } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import { toast } from "react-toastify"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DeviceCard from "../components/DeviceCard"
import { iotWebHandlerEndpts } from "../endpoints"
import MQTTClient from "../components/MQTTClient"

class Devices extends Component {

    state = {
        devices: [],
        errors: {},
        server: false,
        connected: true, // TODO get state of cluster
        refs: {}
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    messageHandler = message => {
        this.state.refs[message.destinationName].current.setDeviceState(message.payloadBytes)
    }

    componentDidMount() {
        this.mqttClient = new MQTTClient(this.props.auth.user.id, "password", [], this.setConnected, this.messageHandler)
        this.getDevices()
        // this.getServer()
    }

    componentWillUnmount() {
        clearTimeout(this.intervalID)
        this.mqttClient.disconnect()
    }

    setConnected = () => {
        this.setState({
            connected: true
        })
        toast.success("Connected to server")
    }

    // TODO send command to client/devices to update config 
    updateConfig = () => {
        // const reqData = { user: this.props.auth.user.id }
        // axios
        //     .post(mqttController + "/update_config", reqData)
        //     .then(res => {
        //         (res.data.success) ?
        //             toast.success("Device configurations updated")
        //             : toast.warning("Failed to update device configurations")
        //     })
        //     .catch(err => {
        //         this.setState({
        //             errors: (err.response) ? err.response.data : err
        //         })
        //         toast.warning("Failed to update device configurations")
        //     })
    }

    // TODO get state of MQTT cluster
    getServer = () => {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/client/get_server", reqData)
            .then(res => {
                const running = res.data.status === "RUNNING"
                if (running) {
                    this.mqttClient.connect()
                    this.updateConfig()
                } else {
                    toast.warning("Server is not running")
                }
                this.setState({
                    server: running
                })
            })
            .catch(err => {
                this.setState({
                    errors: (err.response) ? err.response.data : err
                })
                toast.error("Failed to get server status")
            })
        if (!this.mqttClient.connected) {
            this.intervalID = setTimeout(this.getServer.bind(this), 5000)
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
                    const topic = "/" + device.client_uuid + "/devices/" + device.number + "/state"
                    let updatedRefs = this.state.refs
                    updatedRefs[topic] = createRef()
                    this.setState({
                        refs: updatedRefs
                    })
                    this.mqttClient.subscribe(topic)
                })
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get devices")
            })
    }

    editDevice = (uuid, name, io, signal) => {
        const updateDevice = { user_id: this.props.auth.user.id, uuid: uuid, name: name, io: io, signal: signal }
        axios
            .post(iotWebHandlerEndpts + "/web/device/update", updateDevice)
            .then(() => {
                this.updateConfig()
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
                                this.state.devices.map(device =>
                                    <DeviceCard
                                        key={device.uuid}
                                        ref={this.state.refs["/" + device.client_uuid + "/devices/" + device.number + "/state"]}
                                        device={device}
                                        editDevice={this.editDevice}
                                        publish={this.mqttClient.publish}
                                        serverConnected={this.state.connected}
                                    />
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
