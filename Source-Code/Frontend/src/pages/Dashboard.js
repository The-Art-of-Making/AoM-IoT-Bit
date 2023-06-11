import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DashboardCard from "../components/DashboardCard"
import { actionIcon, zoneIcon } from "../icons/icons"
import UnderConstruction from "../components/UnderContruction"
import { iotWebHandlerEndpts } from "../endpoints"
import { toast } from "react-toastify"

class Dashboard extends Component {

    state = {
        server: "",
        clients: 0,
        devices: 0,
        actions: {},
        errors: {}
    }

    componentDidMount() {
        // this.getServer()
        this.getClients()
        this.getDevices()
        this.getActions()
    }

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    // TODO replace with server info
    // getServer() {
    //     const reqData = { user_id: this.props.auth.user.id }
    //     axios
    //         .post(iotWebHandlerEndpts + "/web/client/get_server", reqData)
    //         .then(res =>
    //             this.setState({
    //                 server: res.data.status
    //             })
    //         )
    //         .catch(err => {
    //             this.setState({
    //                 errors: err.response.data
    //             })
    //             toast.error("Failed to get server status")
    //         })
    // }

    getClients() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/client/all", reqData)
            .then(res =>
                this.setState({
                    clients: res.data.length
                })
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get clients")
            })
    }

    getDevices() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/device/all", reqData)
            .then(res => {
                this.setState({
                    devices: res.data.length
                })
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get devices")
            })
    }

    getActions() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/action/all", reqData)
            .then(res => {
                this.setState({
                    actions: res.data
                })
            }
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get actions")
            })
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
                                    <div className="d-grid text-left p-3 rounded" style={{ background: "#" }}>
                                        {(this.state.actions.length > 0) ?
                                            this.state.actions.map(action => <p key={action.uuid} className="card-text"><span className="text-light" style={{ fontWeight: "bold" }}>&#8627;&ensp;</span>{action.name}</p>)
                                            : <p className="card-text">No actions</p>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="card text-white bg-primary" style={{ maxWidth: "49%" }}>
                                <div className="card-header">{zoneIcon} Zones</div>
                                <div className="card-body bg-primary">
                                    <UnderConstruction height="20vh" />
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