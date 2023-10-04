import { Component } from "react"
import { editIcon, checkIcon, deleteIcon, checkCircleIcon, xCircleIcon } from "../icons/icons"
const payload_pb = require("../cml/js/payload_pb")
const client_inner_payload_pb = require("../cml/js/client/client_inner_payload_pb")

export default class ClientCard extends Component {

    state = {
        edit: false,
        name: this.props.client.name,
        connected: "Disconnected",
        devices: this.props.devices.filter(device => device.client_uuid === this.props.client.uuid)
    }

    onChange = e => {
        this.setState({
            [e.target.id]: e.target.value
        })
    }

    setEdit = edit => {
        this.setState({
            edit: edit
        })
    }

    setClientStatus = status => {
        this.setState({
            connected: status.getStatus().getCommonStatus().getStatus()
        })
    }

    handleMsg = msgBytes => {
        let payload = payload_pb.Payload.deserializeBinary(msgBytes)

        if (payload.getType() === payload_pb.Type.SET
            && payload.getInnerPayloadType() === payload_pb.InnerPayloadType.CLIENT) {
            let client_inner_payload = payload.getClientInnerPayload()
            if (payload.getAck() === payload_pb.Ack.OUTBOUND && client_inner_payload.getType() === client_inner_payload_pb.Type.STATUS) {
                this.setClientStatus(client_inner_payload)
            }
        }
    }

    render() {
        return (
            <div className="card text-white bg-primary pb-3" style={{ maxWidth: (this.props.maxWidth ? this.props.maxWidth : "24.7%") }}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                    {(this.state.edit) ? <input type="text" className="form-control border-secondary" id="name" onChange={this.onChange} value={this.state.name} placeholder={this.state.name}></input> : this.props.client.name}
                    <div>
                        {(this.state.edit)
                            ? <>
                                <div className="btn text-success" onClick={() => {
                                    this.props.editClient(this.props.client.uuid, this.state.name)
                                    this.setEdit(false)
                                }}>{checkIcon}</div>
                            </>
                            : <>
                                <div className="btn text-warning" onClick={() => this.setEdit(true)}>{editIcon}</div>
                                <div className="btn text-danger" onClick={() => this.props.deleteClient(this.props.client.uuid)}>{deleteIcon}</div>
                            </>
                        }
                    </div>
                </div>
                <div className="card-body bg-primary">
                    <p className="card-text">Status:&ensp;{(this.state.connected === "Connected") ? <span className="text-success">{checkCircleIcon}Connected</span> : <span className="text-danger">{xCircleIcon}Disconnected</span>}</p>
                    <p className="card-text">Devices:</p>
                    {this.state.devices.map(device =>
                        <div key={device.uuid} className="d-flex">
                            <p className="text-secondary"><span className="text-light" style={{ fontWeight: "bold" }}>&#8627;&ensp;</span>{device.name}</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}
