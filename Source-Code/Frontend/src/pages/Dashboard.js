import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DashboardCard from "../components/DashboardCard"
import { actionIcon, zoneIcon } from "../icons/icons"

class Dashboard extends Component {

    state = {
        server: "",
        clients: 0,
        devices: 0,
        error: {}
    }

    componentDidMount() {
        this.getServer()
        this.getClients()
        this.getDevices()
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    getServer() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post("http://localhost:5000/web/client/get_server", reqData)
            .then(res =>
                this.setState({
                    server: res.data.status
                })
            )
            .catch(err =>
                this.setState({
                    error: err.response.data.error
                })
            )
    }

    getClients() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post("http://localhost:5000/web/client/get_clients", reqData)
            .then(res =>
                this.setState({
                    clients: res.data.length
                })
            )
            .catch(err =>
                this.setState({
                    error: err.response.data.error
                })
            )
    }

    getDevices() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post("http://localhost:5000/web/client/get_devices", reqData)
            .then(res =>
                this.setState({
                    devices: res.data.length
                })
            )
            .catch(err =>
                this.setState({
                    error: err.response.data.error
                })
            )
    }

    serverTextColor = () => {
        if (this.state.server === "RUNNING") {
            return "text-success"
        }
        if (this.state.server === "SHUTDOWN") {
            return "text-danger"
        }
        return "text-warning"
    }

    render() {
        return (
            <div className="d-flex">
                <Sidebar currentItem="Dashboard" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-center p-1 gap-1">
                            <DashboardCard title="Server" textFormat={this.serverTextColor()} maxWidth="33%" stat={this.state.server} />
                            <DashboardCard title="Clients" textFormat="text-light" maxWidth="33%" stat={this.state.clients} />
                            <DashboardCard title="Devices" textFormat="text-light" maxWidth="33%" stat={this.state.devices} />
                            <div className="card text-white bg-primary" style={{ maxWidth: "50%" }}>
                                <div className="card-header">{actionIcon} Actions</div>
                                <div className="card-body bg-primary">
                                    <div className="d-grid text-left p-3 rounded" style={{background: "#000e1d"}}>
                                        <p className="card-text">Action 1</p>
                                        <p className="card-text">Action 1</p>
                                        <p className="card-text">Action 1</p>
                                        <p className="card-text">Action 1</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card text-white bg-primary" style={{ maxWidth: "49%" }}>
                                <div className="card-header">{zoneIcon} Zones</div>
                                <div className="card-body bg-primary">
                                    <div className="d-grid text-left p-3 rounded mb-2" style={{background: "#000e1d"}}>
                                        <p className="card-text">Zone 1</p>
                                    </div>
                                    <div className="d-grid text-left p-3 rounded mb-2" style={{background: "#000e1d"}}>
                                        <p className="card-text">Zone 1</p>
                                    </div>
                                    <div className="d-grid text-left p-3 rounded mb-2" style={{background: "#000e1d"}}>
                                        <p className="card-text">Zone 1</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

Dashboard.propTypes = {
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
)(Dashboard)