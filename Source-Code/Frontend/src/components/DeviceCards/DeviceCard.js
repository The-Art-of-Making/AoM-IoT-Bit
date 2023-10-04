import { Component } from "react"
import CardInfo from "../CardInfo"
import { editIcon, checkIcon, checkCircleIcon, xCircleIcon } from "../../icons/icons"
import classnames from "classnames"
import { deviceTopicBuidler, deviceTopics } from "../TopicBuilder"
const payload_pb = require("../../cml/js/payload_pb")
const client_inner_payload_pb = require("../../cml/js/client/client_inner_payload_pb")
const device_inner_payload_pb = require("../../cml/js/device/device_inner_payload_pb")

export default class DeviceCard extends Component {

    state = {
        edit: false,
        name: this.props.device.name,
        configType: this.props.device.config_type,
        cmdTopic: deviceTopicBuidler(this.props.device.user_uuid, this.props.device.client_uuid, this.props.device.uuid, deviceTopics.cmd),
        deviceState: this.props.initialDeviceState,
        io: this.props.io,
        connected: "Disconnected"
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

    setDeviceState = state => {
        this.setState({
            deviceState: + state.getGenericDigitalValue()
        })
    }

    setDeviceStatus = status => {
        this.setState({
            connected: status.getStatus().getCommonStatus().getStatus()
        })
    }

    handleMsg = msgBytes => {
        let payload = payload_pb.Payload.deserializeBinary(msgBytes)

        if (payload.getType() === payload_pb.Type.SET) {
            if (payload.getInnerPayloadType() === payload_pb.InnerPayloadType.CLIENT) {
                let client_inner_payload = payload.getClientInnerPayload()
                if (payload.getAck() === payload_pb.Ack.OUTBOUND && client_inner_payload.getType() === client_inner_payload_pb.Type.STATUS) {
                    this.setDeviceStatus(client_inner_payload)
                }
            }
            if (payload.getInnerPayloadType() === payload_pb.InnerPayloadType.DEVICE) {
                let device_inner_payload = payload.getDeviceInnerPayload()
                if (payload.getAck() === payload_pb.Ack.INBOUND && device_inner_payload.getType() === device_inner_payload_pb.Type.STATE) {
                    this.setDeviceState(device_inner_payload)
                }
            }
        }
    }

    buildDevicePayload = () => {
        let payload = new payload_pb.Payload()

        payload.setType(payload_pb.Type.SET)
        payload.setAck(payload_pb.Ack.OUTBOUND)
        payload.setTimestamp(Date.now())
        payload.setTtl(0)
        payload.setInnerPayloadType(payload_pb.InnerPayloadType.DEVICE)

        return payload
    }

    buildCmd = value => {
        let payload = this.buildDevicePayload()
        let device_inner_payload = new device_inner_payload_pb.InnerPayload()

        device_inner_payload.setType(device_inner_payload_pb.Type.STATE)
        device_inner_payload.setGenericDigitalValue(Math.round(value))
        payload.setDeviceInnerPayload(device_inner_payload)

        return payload.serializeBinary()
    }

    getControls = () => {
        return (
            <>
                <div className={classnames((this.state.io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                    <h2>{(parseInt(this.state.deviceState) === 1) ? "ON" : "OFF"}</h2>
                </div>
                {(this.state.io === "output")
                    ? <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
                        <label className="switch align-self-center">
                            <input
                                type="checkbox"
                                checked={(parseInt(this.state.deviceState) === 1) ? true : false}
                                onChange={() =>
                                    this.props.publish(this.state.cmdTopic, (parseInt(this.state.deviceState) === 1) ? this.buildCmd(0) : this.buildCmd(1), 1, true)
                                }
                                disabled={(this.state.connected !== "Connected")}
                            />
                            <span className="slider round" style={{ cursor: (this.state.connected === "Connected") ? "" : "default" }} />
                        </label>
                    </div>
                    : null
                }
            </>
        )
    }

    render() {
        const device = this.props.device
        return (
            <div className="card text-white bg-primary" style={{ maxWidth: (this.props.maxWidth ? this.props.maxWidth : "24.7%") }}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                    {(this.state.edit) ?
                        <input
                            type="text"
                            className="form-control border-secondary"
                            onChange={this.onChange}
                            value={this.state.name}
                            placeholder={this.state.name}
                            id="name"
                        />
                        : device.name}
                    {(this.state.edit)
                        ? <>
                            <div className="btn text-success" onClick={() => {
                                this.props.editDevice(device.uuid, this.state.name, device.user_uuid, device.client_uuid, this.state.configType)
                                this.setEdit(false)
                            }}>{checkIcon}</div>
                        </>
                        : <div className="btn text-light" onClick={() => this.setEdit(true)}>{editIcon}</div>
                    }
                </div>
                <div className="card-body bg-primary">
                    <CardInfo info="Status" value={(this.state.connected === "Connected") ? <span className="text-success">{checkCircleIcon}Connected</span> : <span className="text-danger">{xCircleIcon}Disconnected</span>} textStyle="text-secondary" />
                    <CardInfo info="Client" value={device.client_name} textStyle="text-secondary" />
                    <CardInfo info="Number" value={device.number} textStyle="text-secondary" />
                    {(this.state.edit)
                        ? <div className="d-flex">
                            <p className="card-text" style={{ fontWeight: "bold" }}>Type:&ensp;</p>
                            <select className="form-control mb-2" onChange={this.onChange} value={this.state.configType} id="configType">
                                <option key="Generic Digital Output" value="Generic Digital Output">Generic Digital Output</option>
                                <option key="Generic Digital Input" value="Generic Digital Input">Generic Digital Input</option>
                                <option key="Generic Analog Output" value="Generic Analog Output">Generic Analog Output</option>
                                <option key="Generic Analog Input" value="Generic Analog Input">Generic Analog Input</option>
                            </select>
                        </div>
                        : <CardInfo info="Configuration" value={device.config_type} textStyle="text-secondary" />
                    }
                    {this.getControls()}
                </div>
            </div>
        )
    }

}