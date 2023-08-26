import { Component } from "react"
import CardInfo from "./CardInfo"
import { DeviceControl } from "./DeviceControl"
import { deviceTopicBuidler, deviceTopics } from "./TopicBuilder"
import { editIcon, checkIcon, checkCircleIcon, xCircleIcon } from "../icons/icons"

// Convert ArrayBuffer to value
const convertToNumber = buffer => {
    let value = 0
    for (let i = 0; i < buffer.length; i++) {
        value += buffer[i] << (8 * i)
    }
    return value
}

export default class DeviceCard extends Component {

    state = {
        edit: false,
        name: this.props.device.name,
        config_type: this.props.device.config_type,
        cmdTopic: deviceTopicBuidler(this.props.device.user_uuid, this.props.device.client_uuid, this.props.device.device_uuid, deviceTopics.cmd),
        deviceState: "0"
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
            deviceState: convertToNumber(state)
        })
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
                                this.props.editDevice(device.uuid, this.state.name, device.user_uuid, device.client_uuid, this.state.config_type)
                                this.setEdit(false)
                            }}>{checkIcon}</div>
                        </>
                        : <div className="btn text-light" onClick={() => this.setEdit(true)}>{editIcon}</div>
                    }
                </div>
                <div className="card-body bg-primary">
                    <CardInfo info="Status" value={this.props.connected ? <span className="text-success">{checkCircleIcon}Connected</span> : <span className="text-danger">{xCircleIcon}Disconnected</span>} textStyle="text-secondary" />
                    <CardInfo info="Client" value={device.client_name} textStyle="text-secondary" />
                    <CardInfo info="Number" value={device.number} textStyle="text-secondary" />
                    {(this.state.edit)
                        ? <div className="d-flex">
                            <p className="card-text" style={{ fontWeight: "bold" }}>Type:&ensp;</p>
                            <select className="form-control mb-2" onChange={this.onChange} value={this.state.config_type} id="config_type">
                                <option key="Generic Digital Output" value="Generic Digital Output">Generic Digital Output</option>
                                <option key="Generic Digital Input" value="Generic Digital Input">Generic Digital Input</option>
                                <option key="Generic Analog Output" value="Generic Analog Output">Generic Analog Output</option>
                                <option key="Generic Analog Input" value="Generic Analog Input">Generic Analog Input</option>
                            </select>
                        </div>
                        : <CardInfo info="Configuration" value={device.config_type} textStyle="text-secondary" />
                    }
                    {DeviceControl(this.state.config_type, this.state.deviceState, this.props.publish, this.state.cmdTopic, !this.props.serverConnected)}
                </div>
            </div>
        )
    }

}