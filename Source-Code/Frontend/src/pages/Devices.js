import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DeviceCard from "../components/DeviceCard"

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
            .post("http://localhost:5000/web/client/get_devices", reqData)
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

    render() {
        const testDevice = {
            "_id": "63f185ce26c85552f34f876d",
            "user": "63eacf4612a1731b3d444b9f",
            "uid": "device-c4c8e66b-709a-4757-8408-e20e81738e58",
            "client_name": "Test Client",
            "client_username": "client-30736f14-93f7-4fec-88e4-07c1381c378e",
            "name": "Device 0",
            "number": 0,
            "io": "output",
            "signal": "analog"
        }
        return (
            <div className="d-flex">
                <Sidebar currentItem="Devices" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-left p-1 gap-1">
                            {this.state.devices.map(device => <DeviceCard key={device.uid} device={device} />)}
                            <DeviceCard device={testDevice} />
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