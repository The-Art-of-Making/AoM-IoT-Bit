import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import axios from "axios"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import CardInfo from "../components/CardInfo"

class Server extends Component {

    state = {
        status: "",
        activeClients: 0,
        port: 0,
        errors: {}
    }

    componentDidMount() {
        this.getServer()
    }
    
    componentWillUnmount() {
        clearTimeout(this.intervalID)
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
                    status: res.data.status,
                    activeClients: res.data.client_count,
                    port: res.data.port
                })
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
        this.intervalID = setTimeout(this.getServer.bind(this), 5000)
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

    onClick = e => {
        e.preventDefault()
        const reqData = { user: this.props.auth.user.id }
        if (this.state.server === "SHUTDOWN")
        {
            axios
            .post("http://localhost:10080/start_server", reqData)
            .then(res =>
                console.log(res)
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
        }
        else
        {
            axios
            .post("http://localhost:10080/shutdown_server", reqData)
            .then(res =>
                console.log(res)
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
        }
    }

    render() {
        return (
            <div className="d-flex">
                <Sidebar currentItem="Server" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <div className="row justify-content-center p-1 gap-1">
                            <div className="card text-white bg-primary mb-3">
                                <div className="card-body bg-primary">
                                    <div className="d-grid text-left p-3 rounded bg-dark" style={{ background: "#000e1d" }}>
                                        <h4 className="card-title">Server</h4>
                                        <hr />
                                        <div className="d-flex mb-2">
                                            <div className="form-check form-switch">
                                                <input
                                                    className={"form-check-input " + (this.state.status === "RUNNING" ? "bg-success" : "bg-secondary")}
                                                    type="checkbox"
                                                    onClick={this.onClick}
                                                    checked={(this.state.status === "RUNNING" ? true : false)}
                                                    disabled={(this.state.status !== "SHUTDOWN" && this.state.status !== "RUNNING" ? true : false)} />
                                                <label className="form-check-label">{(this.state.status === "SHUTDOWN" ? "Start" : "Shutdown")}</label>
                                            </div>
                                        </div>
                                        <CardInfo info="Status" value={this.state.status} textStyle={this.serverTextColor()} />
                                        <CardInfo info="Address" value="server.aom-iot.io" textStyle="text-light" />
                                        <CardInfo info="Port" value={this.state.port} textStyle="text-light" />
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