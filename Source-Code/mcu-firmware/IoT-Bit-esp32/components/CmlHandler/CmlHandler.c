#include "CmlHandler.h"
#include "esp_log.h"
#include "pb_decode.h"
#include "pb_encode.h"
#include "payload.pb.h"
#include "client_inner_payload.pb.h"
#include "device_inner_payload.pb.h"

static const char *CML_HANDLER_TAG = "CML_HANDLER";

static bool CmlHandler_EncodeString(pb_ostream_t *stream, const pb_field_iter_t *field, void *const *arg);
static inline void CmlHandler_ConfigurePayload(cml_payload_Payload *const payload, cml_payload_Type type, cml_payload_Ack ack, uint64_t ttl, cml_payload_InnerPayloadType innerPayloadType);
static void CmlHandler_HandleClientInnerPayload(cml_client_InnerPayload clientInnerPayload);
static void CmlHandler_HandlerDeviceInnerPayload(cml_device_InnerPayload deviceInnerPayload);

size_t CmlHandler_BuildSetClientStatusPayload(unsigned char *buffer, size_t size)
{
    cml_payload_Payload payload = cml_payload_Payload_init_zero;
    pb_ostream_t pbStream = pb_ostream_from_buffer(buffer, size);

    CmlHandler_ConfigurePayload(&payload, cml_payload_Type_SET, cml_payload_Ack_OUTBOUND, 0, cml_payload_InnerPayloadType_CLIENT);
    payload.has_client_inner_payload = true;
    payload.client_inner_payload.type = cml_client_Type_STATUS;
    /* TODO set ips and serial number */
    payload.client_inner_payload.has_status = true;
    payload.client_inner_payload.status.has_common_status = true;
    payload.client_inner_payload.status.common_status.status.arg = "Connected";
    payload.client_inner_payload.status.common_status.status.funcs.encode = &CmlHandler_EncodeString;
    pb_encode(&pbStream, cml_payload_Payload_fields, &payload);

    /* TODO register ESP_LOGI logging function with CmlHandler instead of using ESP_LOGI directly */
    ESP_LOGI(CML_HANDLER_TAG, "Built set client status payload");

    return pbStream.bytes_written;
}

size_t CmlHandler_BuildGetClientConfigPayload(unsigned char *buffer, size_t size, char *const uuid, char *const token)
{
    cml_payload_Payload payload = cml_payload_Payload_init_zero;
    pb_ostream_t pbStream = pb_ostream_from_buffer(buffer, size);

    CmlHandler_ConfigurePayload(&payload, cml_payload_Type_GET, cml_payload_Ack_OUTBOUND, 0U, cml_payload_InnerPayloadType_CLIENT);
    payload.has_client_inner_payload = true;
    payload.client_inner_payload.type = cml_client_Type_CONFIG;
    payload.client_inner_payload.has_config = true;
    payload.client_inner_payload.config.has_common_config = true;
    payload.client_inner_payload.config.common_config.uuid.arg = uuid;
    payload.client_inner_payload.config.common_config.uuid.funcs.encode = &CmlHandler_EncodeString;
    payload.client_inner_payload.config.common_config.token.arg = token;
    payload.client_inner_payload.config.common_config.token.funcs.encode = &CmlHandler_EncodeString;
    pb_encode(&pbStream, cml_payload_Payload_fields, &payload);

    ESP_LOGI(CML_HANDLER_TAG, "Built get client config payload");

    return pbStream.bytes_written;
}

void CmlHandler_HandlePayload(const char *data, const unsigned int length)
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
            ESP_LOGI(CML_HANDLER_TAG, "Decoded CML CLIENT payload");
            CmlHandler_HandleClientInnerPayload(payload.client_inner_payload);
            break;
        case cml_payload_InnerPayloadType_DEVICE:
            ESP_LOGI(CML_HANDLER_TAG, "Decoded CML DEVICE payload");
            CmlHandler_HandlerDeviceInnerPayload(payload.device_inner_payload);
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

static bool CmlHandler_EncodeString(pb_ostream_t *stream, const pb_field_iter_t *field, void *const *arg)
{
    const char *str = (const char *)(*arg);

    if (!pb_encode_tag_for_field(stream, field))
        return false;

    return pb_encode_string(stream, (uint8_t *)str, strlen(str));
}

static inline void CmlHandler_ConfigurePayload(cml_payload_Payload *const payload, cml_payload_Type type, cml_payload_Ack ack, uint64_t ttl, cml_payload_InnerPayloadType innerPayloadType)
{
    if (payload != NULL)
    {
        payload->type = type;
        payload->ack = ack;
        /* TODO set timestamp */
        payload->ttl = ttl;
        payload->inner_payload_type = innerPayloadType;
    }
}

static void CmlHandler_HandleClientInnerPayload(cml_client_InnerPayload clientInnerPayload)
{
    switch (clientInnerPayload.type)
    {
    case cml_client_Type_CONFIG:
        ESP_LOGI(CML_HANDLER_TAG, "Received CLIENT CONFIG");
        break;
    case cml_client_Type_STATUS:
        break;
    default:
        break;
    }
}

static void CmlHandler_HandlerDeviceInnerPayload(cml_device_InnerPayload deviceInnerPayload) {}
