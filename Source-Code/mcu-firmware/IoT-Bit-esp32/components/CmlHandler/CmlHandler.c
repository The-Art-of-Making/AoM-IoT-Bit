#include "CmlHandler.h"
#include "esp_log.h"
#include "pb_decode.h"
#include "payload.pb.h"
#include "client_inner_payload.pb.h"
#include "device_inner_payload.pb.h"

static const char *CML_HANDLER_TAG = "CML_HANDLER";

static void CmlHandler_HandleClientInnerPayload();
static void CmlHandler_HandlerDeviceInnerPayload();

void CmlHandler_HandleMessage(const char *data, const unsigned int length)
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
            ESP_LOGD(CML_HANDLER_TAG, "Decoded CML CLIENT payload");
            CmlHandler_HandleClientInnerPayload();
            break;
        case cml_payload_InnerPayloadType_DEVICE:
            ESP_LOGD(CML_HANDLER_TAG, "Decoded CML DEVICE payload");
            CmlHandler_HandlerDeviceInnerPayload();
            break;
        default:
            break;
        }
    }
    else
    {
        ESP_LOGE(CML_HANDLER_TAG, "Failed to decode CML payload.\nDecode Error: %s", PB_GET_ERROR(&pbStream));
    }
}

static void CmlHandler_HandleClientInnerPayload() {}
static void CmlHandler_HandlerDeviceInnerPayload() {}
