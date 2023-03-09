import { useState } from "react"
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

const digitalControl = io => {
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                <h2>OFF</h2>
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
                    <label className="switch align-self-center">
                        <input type="checkbox" />
                        <span className="slider round"></span>
                    </label>
                </div>
                : null
            }
        </>
    )
}

const analogControl = io => {
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                {Gauge(40)}
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center px-2 rounded-bottom">
                    <input type="range" className="form-range"></input>
                </div>
                : null
            }
        </>
    )
}

export default function DeviceCard(props) {
    const [edit, setEdit] = useState(false)
    const [name, setName] = useState(props.device.name)
    const [io, setIO] = useState(props.device.io)
    const [signal, setSignal] = useState(props.device.signal)
    return (
        <div className="card text-white bg-primary" style={{ maxWidth: (props.maxWidth ? props.maxWidth : "24.7%") }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                {(edit) ? <input type="text" className="form-control border-secondary" onChange={e => setName(e.target.value)} value={name} placeholder={name}></input> : props.device.name}
                {(edit)
                    ? <>
                        <div className="btn text-success" onClick={() => {
                            props.editDevice(props.device.uid, name, io, signal)
                            setEdit(false)
                        }}>{checkIcon}</div>
                    </>
                    : <div className="btn text-light" onClick={() => setEdit(true)}>{editIcon}</div>
                }
            </div>
            <div className="card-body bg-primary">
                <CardInfo info="Client" value={props.device.client_name} textStyle="text-secondary" />
                <CardInfo info="Number" value={props.device.number} textStyle="text-secondary" />
                {(edit)
                    ? <div className="d-flex">
                        <p className="card-text" style={{ fontWeight: "bold" }}>IO:&ensp;</p>
                        <select className="form-control mb-2" onChange={e => setIO(e.target.value)} value={io}>
                            <option key="input" value="input">input</option>
                            <option key="output" value="output">output</option>
                        </select>
                    </div>
                    : <CardInfo info="IO" value={props.device.io} textStyle="text-secondary" />
                }
                {(edit)
                    ? <div className="d-flex">
                        <p className="card-text" style={{ fontWeight: "bold" }}>Type:&ensp;</p>
                        <select className="form-control mb-2" onChange={e => setSignal(e.target.value)} value={signal}>
                            <option key="analog" value="analog">analog</option>
                            <option key="digital" value="digital">digital</option>
                        </select>
                    </div>
                    : <CardInfo info="Type" value={props.device.signal} textStyle="text-secondary" />
                }
                {(props.device.signal === "digital" ? digitalControl(io) : analogControl(io))}
            </div>
        </div>
    )
}