import { DeviceControls } from "./DeviceControls"
import { GenericAnalogControls } from "./GenericAnalog"
import { GenericDigitalControls } from "./GenericDigital"

export const buildDeviceControls = (config_type, device, publish, disabled) => {
    let deviceControls = new DeviceControls(device, "output", 0, publish, disabled)
    switch (config_type) {
        case "Generic Digital Output":
            deviceControls = new GenericDigitalControls(device, "output", 0, publish, disabled)
            break
        case "Generic Digital Input":
            deviceControls = new GenericDigitalControls(device, "input", 0, publish, disabled)
            break
        case "Generic Analog Output":
            deviceControls = new GenericAnalogControls(device, "output", 0, publish, disabled)
            break
        case "Generic Analog Input":
            deviceControls = new GenericAnalogControls(device, "input", 0, publish, disabled)
            break
        default:
            break
    }
    return (
        deviceControls
    )
}
