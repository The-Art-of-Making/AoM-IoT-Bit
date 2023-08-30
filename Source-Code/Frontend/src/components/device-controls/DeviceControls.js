import classnames from "classnames"
import { deviceTopicBuidler, deviceTopics } from "../TopicBuilder"
const payload_pb = require("../../cml/js/payload_pb")
const device_inner_payload_pb = require("../../cml/js/device/inner_payload_pb")

export class DeviceControls {

    constructor(device, io, state, publish, disabled) {
        this.device = device
        this.cmdTopic = deviceTopicBuidler(device.user_uuid, device.client_uuid, device.uuid, deviceTopics.cmd)
        this.io = io
        this.state = state
        this.publish = publish
        this.disabled = disabled
    }

    setState = state => {
        this.state = + state.getGenericDigitalValue()
    }

    handleStateMsg = msgBytes => {
        let payload = payload_pb.Payload.deserializeBinary(msgBytes)

        if (payload.getType() === payload_pb.Type.SET
            && payload.getAck() === payload_pb.Ack.INBOUND
            && payload.getInnerPayloadType() === payload_pb.InnerPayloadType.DEVICE) {
            let device_inner_payload = payload.getDeviceInnerPayload()
            if (device_inner_payload.getType() === device_inner_payload_pb.Type.STATE) {
                this.setState(device_inner_payload)
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
                <div className={classnames((this.io === "input") ? "rounded pb-2" : "rounded-top", "bg-dark d-flex justify-content-center pt-3")}>
                    <h2>{(parseInt(this.state) === 1) ? "ON" : "OFF"}</h2>
                </div>
                {(this.io === "output")
                    ? <div className="bg-dark d-flex justify-content-center pb-3 rounded-bottom">
                        <label className="switch align-self-center">
                            <input
                                type="checkbox"
                                checked={(parseInt(this.state) === 1) ? true : false}
                                onChange={() => this.publish(this.cmdTopic, (parseInt(this.state) === 1) ? this.buildCmd(0) : this.buildCmd(1))}
                                disabled={this.disabled}
                            />
                            <span className="slider round" style={{ cursor: this.disabled ? "default" : "" }} />
                        </label>
                    </div>
                    : null
                }
            </>
        )
    }
}
