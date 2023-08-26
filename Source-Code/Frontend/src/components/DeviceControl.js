import classnames from "classnames"

// Convert value to ArrayBuffer
const convertToBuffer = value => {
    const buffer = new ArrayBuffer(4)
    const uint32 = new Uint32Array(buffer)
    uint32.set([value], 0)
    return buffer
}

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

const digitalControl = (io, state, publish, topic, disabled) => {
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                <h2>{(parseInt(state) === 1) ? "ON" : "OFF"}</h2>
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
                    <label className="switch align-self-center">
                        <input
                            type="checkbox"
                            checked={(parseInt(state) === 1) ? true : false}
                            onChange={() => publish(topic, (parseInt(state) === 1) ? convertToBuffer(0) : convertToBuffer(1))}
                            disabled={disabled}
                        />
                        <span className="slider round" style={{ cursor: disabled ? "default" : "" }} />
                    </label>
                </div>
                : null
            }
        </>
    )
}

const analogControl = (io, state, publish, topic, disabled) => {
    const value = parseInt(state) / 4095
    return (
        <>
            <div className={classnames((io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                {Gauge((value * 100).toFixed(1))}
            </div>
            {(io === "output")
                ? <div className="bg-dark d-flex justify-content-center px-2 rounded-bottom">
                    <input
                        type="range"
                        className="form-range"
                        value={value * 100}
                        onChange={e => publish(topic, convertToBuffer(e.target.value / 100 * 4096))}
                        disabled={disabled}
                    />
                </div>
                : null
            }
        </>
    )
}

export const DeviceControl = (config_type, state, publish, topic, disabled) => {
    let deviceControl = <></>
    switch (config_type) {
        case "Generic Digital Output":
            deviceControl = digitalControl("output", state, publish, topic, disabled)
            break
        case "Generic Digital Input":
            deviceControl = digitalControl("input", state, publish, topic, disabled)
            break
        case "Generic Analog Output":
            deviceControl = analogControl("output", state, publish, topic, disabled)
            break
        case "Generic Analog Input":
            deviceControl = analogControl("pint", state, publish, topic, disabled)
            break
        default:
            break
    }
    return (
        deviceControl
    )
}
