import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DeviceCard from "../components/DeviceCard"
import { clientAuth } from "../endpoints"

class Devices extends Component {

    state = {
        devices: [],
        errors: {}
    }

    componentDidMount() {
        this.getDevices()
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    getDevices() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post(clientAuth + "/web/client/get_devices", reqData)
            .then(res => {
                this.setState({
                    devices: res.data
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
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-left p-1 gap-1">
                            {this.state.devices.map(device => <DeviceCard key={device.uid} device={device} editDevice={this.editDevice} />)}
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