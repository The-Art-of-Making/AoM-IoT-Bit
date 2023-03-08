import CardInfo from "./CardInfo"
import { editIcon } from "../icons/icons"

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

const digitalControl = <>
    <div className="bg-dark d-flex justify-content-center pt-3 rounded-top">
        <h2>OFF</h2>
    </div>
    <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
        <label className="switch align-self-center">
            <input type="checkbox" />
            <span className="slider round"></span>
        </label>
    </div>
</>

const analogControl = <>
    <div className="bg-dark d-flex justify-content-center pt-3 rounded-top">
        {Gauge(40)}
    </div>
    <div className="bg-dark d-flex justify-content-center px-2 rounded-bottom">
        <input type="range" className="form-range"></input>
    </div>
</>

export default function DeviceCard(props) {
    return (
        <div className="card text-white bg-primary" style={{ maxWidth: (props.maxWidth ? props.maxWidth : "24.7%") }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                {props.device.name}
                <button className="btn text-light">{editIcon}</button>
            </div>
            <div className="card-body bg-primary">
                <CardInfo info="Client" value={props.device.client_name} textStyle="text-secondary" />
                <CardInfo info="IO" value={props.device.io} textStyle="text-secondary" />
                <CardInfo info="Type" value={props.device.signal} textStyle="text-secondary" />
                {(props.device.signal === "digital" ? digitalControl : analogControl)}
            </div>
        </div>
    )
}