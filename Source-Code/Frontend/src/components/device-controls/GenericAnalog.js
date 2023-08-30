import { DeviceControls } from "./DeviceControls"
import classnames from "classnames"
const device_inner_payload_pb = require("../../cml/js/device/inner_payload_pb")

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

export class GenericAnalogControls extends DeviceControls {
    setState = state => {
        this.state = state.getGenericAnalogValue()
    }

    buildCmd = value => {
        let payload = this.buildDevicePayload()
        let device_inner_payload = new device_inner_payload_pb.InnerPayload()

        device_inner_payload.setType(device_inner_payload_pb.Type.STATE)
        device_inner_payload.setGenericAnalogValue(Math.round(value))
        payload.setDeviceInnerPayload(device_inner_payload)

        console.log(payload.toObject())

        return payload.serializeBinary()
    }

    getControls = () => {
        const value = parseInt(this.state) / 4095
        return (
            <>
                <div className={classnames((this.io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                    {Gauge((value * 100).toFixed(1))}
                </div>
                {(this.io === "output")
                    ? <div className="bg-dark d-flex justify-content-center px-2 rounded-bottom">
                        <input
                            type="range"
                            className="form-range"
                            value={value * 100}
                            onChange={e => this.publish(this.cmdTopic, this.buildCmd(e.target.value / 100 * 4096))}
                            disabled={this.disabled}
                        />
                    </div>
                    : null
                }
            </>
        )
    }
}