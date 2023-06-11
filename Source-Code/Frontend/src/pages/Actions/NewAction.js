import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import axios from "axios"
import classnames from "classnames"
import { checkIcon, deleteIcon } from "../../icons/icons"
import ActionResponse from "../../components/ActionResponse"
import { iotWebHandlerEndpts } from "../../endpoints"
import { toast } from "react-toastify"

class NewAction extends Component {

    state = {
        devices: [],
        outputDevices: [],
        name: "",
        triggerDevice: {},
        triggerState: 0,
        deviceResponses: [],
        errors: {}
    }

    componentDidMount() {
        this.getDevices()
    }

    getDevices() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/device/all", reqData)
            .then(res => {
                this.setState({
                    devices: res.data,
                    outputDevices: res.data.filter(device => device.io === "output")
                })
            }
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get devices")
            })
    }

    onChange = e => {
        this.setState({
            [e.target.id]: e.target.value
        })
    }

    updateTriggerDevice = e => {
        const uuid = e.target.value
        const triggerDevice = this.state.devices.find(device => device.uuid === uuid)
        this.setState({
            triggerDevice: (triggerDevice === undefined) ? {} : triggerDevice
        })
    }

    addAction = e => {
        e.preventDefault()
        let deviceResponses = this.state.deviceResponses
        deviceResponses.push({
            index: deviceResponses.length,
            response: {
                device: "",
                signal: "analog",
                state: 0
            }
        })
        this.setState({
            deviceResponses: deviceResponses
        })
    }

    updateResponseDevice = (index, uuid) => {
        const device = this.state.devices.find(device => device.uuid === uuid)
        let deviceResponses = this.state.deviceResponses
        deviceResponses[index].response.device = uuid
        deviceResponses[index].response.signal = (device === undefined) ? "analog" : device.signal
        this.setState({
            deviceResponses: deviceResponses
        })
    }

    updateResponseState = (index, state) => {
        let deviceResponses = this.state.deviceResponses
        deviceResponses[index].response.state = state
        this.setState({
            deviceResponses: deviceResponses
        })
    }

    onSubmit = e => {
        e.preventDefault()
        const triggerTopic = (Object.keys(this.state.triggerDevice).length === 0)
            ? ""
            : "/" + this.state.triggerDevice.client_uuid + "/devices/" + this.state.triggerDevice.number.toString() + "/state"
        let deviceResponses = {}
        this.state.deviceResponses.forEach(response => {
            const device = response.response.device
            const state = response.response.state.toString()
            deviceResponses[device] = state
        })
        const newAction = {
            user_id: this.props.auth.user.id,
            name: this.state.name,
            trigger_topic: triggerTopic,
            trigger_state: this.state.triggerState.toString(),
            device_responses: deviceResponses
        }
        axios
            .post(iotWebHandlerEndpts + "/web/action/add", newAction)
            .then(() =>
                toast.success("Successfully added action")
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to add action")
            }
            )
    }


    render() {

        const { errors } = this.state
        const deviceOptions = this.state.devices.map(device => <option key={device.uuid} value={device.uuid}>{device.name}</option>)
        const responseOptions = this.state.outputDevices.map(device =>
            <option
                key={device.uuid}
                signal={device.signal}
                value={device.uuid}
                disabled={this.state.deviceResponses.find(response => response.response.device === device.uuid)}
            >
                {device.name}
            </option>
        )
        const responseElements = this.state.deviceResponses.map(response =>
            <ActionResponse
                key={response.index}
                index={response.index}
                responseOptions={responseOptions}
                errors={this.state.errors}
                signal={response.response.signal}
                responseDevice={response.response.device}
                updateResponseDevice={this.updateResponseDevice}
                responseState={response.response.state}
                updateResponseState={this.updateResponseState}
            />
        )

        return (
            <form noValidate onSubmit={this.onSubmit}>
                <div className="container">
                    <div className="d-flex justify-content-center h-100 row align-items-center">
                        <div className="col card p-3 m-3 bg-primary">
                            <div className="card-header mb-3">New Action</div>
                            <div className="form-group mb-2">
                                <label>Name</label>
                                <input
                                    className={classnames((errors.name !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.name })}
                                    onChange={this.onChange}
                                    value={this.state.name}
                                    placeholder="Action Name"
                                    error={errors.name}
                                    id="name"
                                    type="text"
                                />
                                {(errors.name) ? <><small className="form-text text-danger">{errors.name}</small><br /></> : null}
                                <label className="mt-3">Trigger Device</label>
                                <select
                                    className={classnames((errors.triggerTopic !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.triggerTopic })}
                                    onChange={this.updateTriggerDevice}
                                    error={errors.triggerTopic}
                                    id="triggerDevice"
                                >
                                    <option key="default" value="">Select a device...</option>
                                    {deviceOptions}
                                </select>
                                {(errors.triggerTopic) ? <><small className="form-text text-danger">{errors.triggerTopic}</small><br /></> : null}
                                <label className="mt-3">Trigger State</label>
                                {(this.state.triggerDevice.signal === "digital")
                                    ? <>
                                        <select
                                            className={classnames((errors.triggerState !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.triggerState })}
                                            onChange={this.onChange}
                                            value={this.state.triggerState}
                                            error={errors.triggerState}
                                            id="triggerState"
                                        >
                                            <option key="on" value={1}>On</option>
                                            <option key="off" value={0}>Off</option>
                                        </select>
                                    </>
                                    : <div className="d-flex justify-content-between">
                                        <input
                                            className={classnames((errors.triggerState !== undefined) ? "form-range is-invalid" : "form-range", { invalid: errors.triggerState })}
                                            style={{ maxWidth: "90%" }}
                                            onChange={this.onChange}
                                            value={this.state.triggerState}
                                            error={errors.triggerState}
                                            id="triggerState"
                                            type="range"
                                            min="0"
                                            max="4095"
                                        />
                                        <label>{this.state.triggerState} / 4095</label>
                                    </div>
                                }
                                {(errors.triggerState) ? <><small className="form-text text-danger">{errors.triggerState}</small><br /></> : null}
                                <label className="mt-3">Device Responses</label>
                                <div className="col">
                                    {responseElements}
                                </div>
                                {(this.state.outputDevices.length === this.state.deviceResponses.length) ? null : <button className="btn text-light" onClick={this.addAction}>+ Add Action</button>}
                                {(errors.deviceResponses && this.state.deviceResponses.length === 0) ? <div><small className="form-text text-danger">{errors.deviceResponses}</small><br /></div> : null}
                            </div>
                            <div className="d-flex flex-row-reverse">
                                <button className="btn text-success" type="submit">{checkIcon} Add Action</button>
                                <Link className="btn text-danger" to="/actions" style={{ textDecoration: "none" }}>{deleteIcon} Cancel</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        )
    }
}

NewAction.propTypes = {
    auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
})
export default connect(
    mapStateToProps
)(NewAction)
