import { Component } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import axios from "axios"
import ClientCard from "../../components/ClientCard"

class AllClients extends Component {

    state = {
        clients: [],
        devices: [],
        errors: {}
    }

    componentDidMount() {
        this.getClients()
        this.getDevices()
    }

    componentWillUnmount() {
        clearTimeout(this.getClientsIntervalID)
        clearTimeout(this.getDevicesIntervalID)
    }

    getClients() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post("http://localhost:5000/web/client/get_clients", reqData)
            .then(res =>
                this.setState({
                    clients: res.data
                })
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
        this.getClientsIntervalID = setTimeout(this.getClients.bind(this), 5000)
    }

    getDevices() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post("http://localhost:5000/web/client/get_devices", reqData)
            .then(res =>
                this.setState({
                    devices: res.data
                })
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
        this.getDevicesIntervalID = setTimeout(this.getDevices.bind(this), 5000)
    }

    deleteClient = client => {
        const reqData = { user: this.props.auth.user.id, username: client }
        axios
            .post("http://localhost:5000/web/client/delete", reqData)
            .then(res =>
                console.log(res)
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
    }

    render() {
        return (
            <div className="row justify-content-left p-1 gap-1">
                {this.state.clients.map(client => <ClientCard key={client.username} client={client} devices={this.state.devices} deleteClient={this.deleteClient} />)}
                <div className="card text-white bg-primary" style={{ maxWidth: "24.7%" }} >
                    <Link style={{ textDecoration: "none" }} to="new_client">
                        <div className="card-body bg-primary">
                            <div className="bg-dark d-grid text-center py-5 rounded">
                                <h3 className="text-white">Add Client</h3>
                                <h2 className="text-white">+</h2>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }
}

AllClients.propTypes = {
    auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
})
export default connect(
    mapStateToProps
)(AllClients)