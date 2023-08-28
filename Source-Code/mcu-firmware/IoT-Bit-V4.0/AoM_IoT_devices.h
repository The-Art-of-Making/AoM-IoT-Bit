// Configure devices for the AoM IoT bit

#ifndef __AOM_IOT_DEVICES__
#define __AOM_IOT_DEVICES__

#include "controller_message.pb.h"
#include "device.pb.h"

struct Device
{
    unsigned char pin;
    uint32_t number;
    uint32_t value;
    aom_iot_device_IO io;
    aom_iot_device_Signal signal;
    bool enabled;
    bool publish;
    Device() : pin(0), number(0), enabled(false), publish(false) {}
    Device(unsigned char pin, uint32_t number) : pin(pin), number(number), enabled(false), publish(false) {}
};

/*
 * Function prototypes
 */

// Load config for a Device from a ControllerMessage
bool loadDeviceConfig(Device *, aom_iot_controller_ControllerMessage *);

// Enable a device
void enabledDevice(Device *, void (*)());

// Load config and enable device
bool configureDevice(Device *, aom_iot_controller_ControllerMessage *, void (*)());

/*
 * Function definitions
 */

bool loadDeviceConfig(Device *device, aom_iot_controller_ControllerMessage *controllerMessage)
{
    if (controllerMessage->device.number != device->number)
    {
        Serial.print("Failed to load device config for device ");
        Serial.println(device->number);
        Serial.println("Device numbers do not match");
        return false;
    }
    device->io = controllerMessage->device.io;
    device->signal = controllerMessage->device.signal;
    return true;
}

void enabledDevice(Device *device, void (*ISR)())
{
    // Configre pin mode
    if (device->io == aom_iot_device_IO_INPUT)
    {
        pinMode(device->pin, INPUT);

        if (device->signal == aom_iot_device_Signal_DIGITAL && ISR != NULL)
        {
            detachInterrupt(digitalPinToInterrupt(device->pin));
            attachInterrupt(digitalPinToInterrupt(device->pin), ISR, CHANGE); // TODO allow user to set mode
        }
    }
    else
    {
        pinMode(device->pin, OUTPUT);

        // Set default value LOW/0
        if (device->signal == aom_iot_device_Signal_DIGITAL)
        {
            digitalWrite(device->pin, LOW);
        }
        else
        {
            analogWrite(device->pin, 0);
        }
    }

    device->value = LOW;
    device->enabled = true;
}

bool configureDevice(Device *device, aom_iot_controller_ControllerMessage *controllerMessage, void (*ISR)())
{
    if (!loadDeviceConfig(device, controllerMessage))
    {
        Serial.print("Failed to configure device ");
        Serial.println(device->number);
        return false;
    }

    enabledDevice(device, ISR);

    Serial.print("Successfully configured device ");
    Serial.println(device->number);
    Serial.print("IO: ");
    Serial.print(device->io);
    Serial.print(" Signal: ");
    Serial.println(device->signal);

    return true;
}

#endif
