import { Component } from "react"
import classnames from "classnames"
import CardInfo from "./CardInfo"
import { editIcon, checkIcon } from "../icons/icons"

const Gauge = (percent = 0, radius = 45, color = "#21c181") => {
    const strokeWidth = radius * 0.25
    const innerRadius = radius - strokeWidth / 2
    const circumference = innerRadius * 2 * Math.PI
    const arc = circumference * (270 / 360)
    const dashArray = `${arc} ${circumference}`
    const transform = `rotate(135, ${radius}, ${radius})`
    const offset = arc - (percent / 100) * arc
    return (
        <svg height={radius * 2} width={radius * 2}>
            <circle
                cx={radius}
                cy={radius}
                fill="transparent"
                r={innerRadius}
                stroke="#5f7490"
                strokeDasharray={dashArray}
                strokeWidth={strokeWidth}
                transform={transform}
            />
            <circle
                cx={radius}
                cy={radius}
                fill="transparent"
                r={innerRadius}
                stroke={color}
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                strokeWidth={strokeWidth}
                style={{
                    transition: "stroke-dashoffset 0.3s",
                }}
                transform={transform}
            />
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
            >
                {percent + "%"}
            </text>
        </svg>
    )
}

const digitalControl = (io, state, publish, topic) => {
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                <h2>{(parseInt(state) === 1) ? "ON" : "OFF"}</h2>
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
                    <label className="switch align-self-center">
                        <input type="checkbox" checked={(parseInt(state) === 1) ? true : false} onChange={() => publish(topic, (parseInt(state) === 1) ? "0" : "1")} />
                        <span className="slider round" />
                    </label>
                </div>
                : null
            }
        </>
    )
}

const analogControl = (io, state, publish, topic) => {
    const value = parseInt(state) / 4095
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                {Gauge((value * 100).toFixed(1))}
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center px-2 rounded-bottom">
                    <input type="range" className="form-range" value={value * 100} onChange={e => publish(topic, (e.target.value / 100 * 4096).toString())} />
                </div>
                : null
            }
        </>
    )
}

export default class DeviceCard extends Component {

    state = {
        edit: false,
        name: this.props.device.name,
        io: this.props.device.io,
        signal: this.props.device.signal,
        cmdTopic: "/" + this.props.device.client_username + "/devices/" + this.props.device.number + "/cmd",
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
            deviceState: state
        })
    }

    render() {
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
                        />
                        : this.props.device.name}
                    {(this.state.edit)
                        ? <>
                            <div className="btn text-success" onClick={() => {
                                this.props.editDevice(this.props.device.uid, this.state.name, this.state.io, this.state.signal)
                                this.setEdit(false)
                            }}>{checkIcon}</div>
                        </>
                        : <div className="btn text-light" onClick={() => this.setEdit(true)}>{editIcon}</div>
                    }
                </div>
                <div className="card-body bg-primary">
                    <CardInfo info="Client" value={this.props.device.client_name} textStyle="text-secondary" />
                    <CardInfo info="Number" value={this.props.device.number} textStyle="text-secondary" />
                    {(this.state.edit)
                        ? <div className="d-flex">
                            <p className="card-text" style={{ fontWeight: "bold" }}>IO:&ensp;</p>
                            <select className="form-control mb-2" onChange={this.onChange} value={this.state.io}>
                                <option key="input" value="input">input</option>
                                <option key="output" value="output">output</option>
                            </select>
                        </div>
                        : <CardInfo info="IO" value={this.props.device.io} textStyle="text-secondary" />
                    }
                    {(this.state.edit)
                        ? <div className="d-flex">
                            <p className="card-text" style={{ fontWeight: "bold" }}>Type:&ensp;</p>
                            <select className="form-control mb-2" onChange={this.onChange} value={this.state.signal}>
                                <option key="analog" value="analog">analog</option>
                                <option key="digital" value="digital">digital</option>
                            </select>
                        </div>
                        : <CardInfo info="Type" value={this.props.device.signal} textStyle="text-secondary" />
                    }
                    {(this.props.device.signal === "digital" ?
                        digitalControl(this.state.io, this.state.deviceState, this.props.publish, this.state.cmdTopic)
                        : analogControl(this.state.io, this.state.deviceState, this.props.publish, this.state.cmdTopic))}
                </div>
            </div>
        )
    }

}