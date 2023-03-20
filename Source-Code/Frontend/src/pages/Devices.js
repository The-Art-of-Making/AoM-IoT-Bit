import { Component, createRef } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DeviceCard from "../components/DeviceCard"
import { clientAuth } from "../endpoints"
import MQTTClient from "../components/MQTTClient"

class Devices extends Component {

    state = {
        devices: [],
        errors: {},
        refs: {}
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    messageHandler = message => {
        this.state.refs[message.destinationName].current.setDeviceState(message.payloadString)
    }

    componentDidMount() {
        this.mqttClient = new MQTTClient(this.props.auth.user.id, "password", [], this.messageHandler)
        this.getDevices()
        this.getServer()
    }

    componentWillUnmount() {
        clearTimeout(this.intervalID)
        this.mqttClient.disconnect()
    }

    getServer = () => {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post(clientAuth + "/web/client/get_server", reqData)
            .then(res => {
                if (res.data.status === "RUNNING") {
                    this.mqttClient.connect()
                    // TODO make request to update_config
                }
            })
            .catch(err =>
                this.setState({
                    errors: (err.response) ? err.response.data : err
                })
            )
        if (!this.mqttClient.connected) {
            this.intervalID = setTimeout(this.getServer.bind(this), 5000)
        }
    }

    getDevices = () => {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post(clientAuth + "/web/client/get_devices", reqData)
            .then(res => {
                this.setState({
                    devices: res.data
                })
                res.data.forEach(device => {
                    const topic = "/" + device.client_username + "/devices/" + device.number + "/state"
                    let updatedRefs = this.state.refs
                    updatedRefs[topic] = createRef()
                    this.setState({
                        refs: updatedRefs
                    })
                    this.mqttClient.subscribe(topic)
                })
            })
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
    }

    editDevice = (uid, name, io, signal) => {
        const updateDevice = { user: this.props.auth.user.id, uid: uid, name: name, io: io, signal: signal }
        axios
            .post(clientAuth + "/web/client/update_device", updateDevice)
            .then(res => {
                this.getDevices()
                console.log(res)
            })
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
    }

    render() {
        return (
            <div className="d-flex">
                <Sidebar currentItem="Devices" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.props.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-left p-1 gap-1">
                            {
                                this.state.devices.map(device =>
                                    <DeviceCard
                                        key={device.uid}
                                        ref={this.state.refs["/" + device.client_username + "/devices/" + device.number + "/state"]}
                                        device={device}
                                        editDevice={this.editDevice}
                                        publish={this.mqttClient.publish}
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
