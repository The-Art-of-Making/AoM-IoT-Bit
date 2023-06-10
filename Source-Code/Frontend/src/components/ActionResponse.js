import classnames from "classnames"

export default function ActionResponse(props) {
    return (
        <div>
            <div className="d-flex justify-content-between gap-3 my-2">
                <select
                    className={classnames((props.errors.deviceResponses !== undefined) ? "form-control is-invalid" : "form-control", { invalid: props.errors.deviceResponses })}
                    style={{ width: "50%" }}
                    onChange={e => props.updateResponseDevice(props.index, e.target.value)}
                    error={props.errors.deviceResponses}
                    id="responseDevice"
                >
                    <option key="default" value="">Select a device...</option>
                    {props.responseOptions}
                </select>
                {
                    (props.signal === "digital")
                        ? <>
                            <select
                                className="form-control"
                                style={{ width: "50%" }}
                                onChange={e => props.updateResponseState(props.index, e.target.value)}
                                value={props.responseState}
                                id="responseState"
                            >
                                <option key="on" value={1}>On</option>
                                <option key="off" value={0}>Off</option>
                            </select>
                        </>
                        : <div className="d-flex justify-content-between" style={{ width: "50%" }}>
                            <input
                                className="form-range"
                                style={{ maxWidth: "80%" }}
                                onChange={e => props.updateResponseState(props.index, e.target.value)}
                                value={props.responseState}
                                id="responseState"
                                type="range"
                                min="0"
                                max="4095"
                            />
                            <label>{props.responseState} / 4095</label>
                        </div>
                }
            </div>
            {(props.errors.deviceResponses) ? <><small className="form-text text-danger">{props.errors.deviceResponses}</small><br /></> : null}</div>
    )
}
