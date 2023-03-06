import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DashboardCard from "../components/DashboardCard"

class Server extends Component {

    state = {
        status: "",
        activeClients: 0,
        internalAddr: "",
        deploymentName: "",
        port: 0,
        uid: "",
        error: {}
    }

    componentDidMount() {
        this.getServer()
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
                    status: res.data.status
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
                <Sidebar currentItem="Zones" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-center p-1 gap-1">
                            <DashboardCard title="Server" textFormat={this.serverTextColor()} maxWidth="33%" stat={this.state.status} />
                            <DashboardCard title="Clients" textFormat="text-light" maxWidth="33%" stat={4} />
                            <DashboardCard title="Devices" textFormat="text-light" maxWidth="33%" stat={4} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

Server.propTypes = {
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
)(Server)