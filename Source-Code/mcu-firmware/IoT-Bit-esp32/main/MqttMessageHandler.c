#include "MqttMessageHandler.h"
#include "pb_decode.h"
#include "payload.pb.h"
#include "inner_payload.pb.h"

static void MqttMessageHandler_HandleClientInnerPayload();
static void MqttMessageHandler_HandlerDeviceInnerPayload();

void MqttMessageHandler_HandleMessage(const char *data, const unsigned int length)
{
    cml_payload_Payload payload = cml_payload_Payload_init_zero;
    pb_istream_t pbStream = pb_istream_from_buffer((unsigned char *)data, length);
    bool decoded = pb_decode(&pbStream, cml_payload_Payload_fields, &payload);

    if (decoded)
    {
        switch (payload.inner_payload_type)
        {
        case cml_payload_InnerPayloadType_RAW:
            break;
        case cml_payload_InnerPayloadType_LOG:
            break;
        case cml_payload_InnerPayloadType_CLIENT:

        default:
            break;
        }
    }
}

static void MqttMessageHandler_HandleClientInnerPayload() {}
static void MqttMessageHandler_HandlerDeviceInnerPayload() {}