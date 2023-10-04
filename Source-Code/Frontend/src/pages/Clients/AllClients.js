import { Component, createRef } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { toast } from "react-toastify"
import axios from "axios"
import ClientCard from "../../components/ClientCard"
import { iotWebHandlerEndpts } from "../../endpoints"
import MQTTClient from "../../components/MQTTClient"
import { clientTopicBuilder, clientTopics } from "../../components/TopicBuilder"
import { Subscriber, Broker } from "../../components/PubSub"

class AllClients extends Component {

    broker = new Broker()

    state = {
        clients: [],
        devices: [],
        errors: {},
        connected: false,
        reconnectTimeout: 1500,
        refs: {},
        subscribers: {}
    }

    messageHandler = message => {
        this.broker.publish(message.destinationName, message.payloadBytes)
    }

    componentDidMount() {
        this.mqttClient = new MQTTClient(this.props.auth.user.id, "password", [], this.setConnected, this.messageHandler)
        this.getClients()
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

    getClients() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/client/all", reqData)
            .then(res => {
                this.setState({
                    clients: res.data
                })
                res.data.forEach(client => {
                    const statusTopic = clientTopicBuilder(client.user_uuid, client.uuid, clientTopics.status)

                    let updatedRefs = this.state.refs
                    updatedRefs[client.uuid] = createRef()
                    this.setState({
                        refs: updatedRefs
                    })

                    let updateSubscribers = this.state.subscribers
                    updateSubscribers[client.uuid] = new Subscriber((topic, data) => updatedRefs[client.uuid].current.handleMsg(data))
                    this.setState({
                        subscribers: updateSubscribers
                    }, () => {
                        this.broker.subscribe(this.state.subscribers[client.uuid], statusTopic)
                        this.mqttClient.subscribe(statusTopic)
                    })
                })
            })
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
            .then(res =>
                this.setState({
                    devices: res.data
                })
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.warning("Failed to get devices")
            })
    }

    editClient = (uuid, name) => {
        const updateClient = { user_id: this.props.auth.user.id, uuid: uuid, name: name }
        axios
            .post(iotWebHandlerEndpts + "/web/client/update", updateClient)
            .then(() => {
                this.getClients()
                this.getDevices()
                toast.success("Successfully edited client")
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to edited client")
            })
    }

    deleteClient = uuid => {
        const reqData = { user_id: this.props.auth.user.id, uuid: uuid }
        axios
            .post(iotWebHandlerEndpts + "/web/client/delete", reqData)
            .then(() => {
                this.getClients()
                this.getDevices()
                toast.success("Successfully deleted client")
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to delete client")
            }
            )
    }

    render() {
        return (
            <div className="row justify-content-left p-1 gap-1">
                {this.state.clients.map(client =>
                    <ClientCard
                        key={client.uuid}
                        ref={this.state.refs[client.uuid]}
                        client={client}
                        devices={this.state.devices}
                        editClient={this.editClient}
                        deleteClient={this.deleteClient}
                    />
                )}
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
