/* Includes
****************************************************************************************************/
#include <inttypes.h>
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "mqtt_client.h"

#include "CmlHandler.h"
#include "TopicBuilder.h"
#include "Wifi.h"

/* Defines and globals
****************************************************************************************************/
#define MQTT_TOPIC_BUFFER_SIZE (1024U)
#define MQTT_PAYLOAD_BUFFER_SIZE (1024U)
#define MQTT_RETAIN_FALSE (0U)
#define MQTT_RETAIN_TRUE (1U)
#define MQTT_QOS_0 (0U)
#define MQTT_QOS_1 (1U)
#define MQTT_QOS_2 (2U)

static const char *APP_TAG = "APP";
static const char *MQTT_TAG = "MQTT";
static const char *CONFIG_TOPIC = "config/mqtt";

static esp_mqtt_client_handle_t mqttClient;
static char mqttTopicBuffer[MQTT_TOPIC_BUFFER_SIZE];
static TopicBuilder_Context_t mqttTopicBuilder = {
    .Buffer = mqttTopicBuffer,
    .BufferSize = MQTT_TOPIC_BUFFER_SIZE,
};
static uint8_t mqttPayloadBuffer[MQTT_PAYLOAD_BUFFER_SIZE];

/* Function prototypes
****************************************************************************************************/

void app_main(void);
static void app_init(void);
static void mqttStart(void);
static void mqttEventHandler(void *handlerArgs, esp_event_base_t base, int32_t eventId, void *eventData);
static void mqttLogNonZeroError(const char *message, int error_code);
static void mqttHandleEventConnected(esp_mqtt_event_handle_t event);

/* Function definitions
****************************************************************************************************/

void app_main()
{
    ESP_LOGI(APP_TAG, "Startup...");
    ESP_LOGI(APP_TAG, "Free memory: %" PRIu32 " bytes", esp_get_free_heap_size());
    ESP_LOGI(APP_TAG, "IDF version: %s", esp_get_idf_version());

    app_init();

    Wifi_init();
    Wifi_start();

    mqttStart();
}

static void app_init()
{
    /* Initialize NVS */
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
}

static void mqttStart()
{
    esp_mqtt_client_config_t mqttCfg = {
        .broker.address.uri = CONFIG_BROKER_URL,
        .credentials.username = CONFIG_CLIENT_UUID,
        .credentials.client_id = CONFIG_CLIENT_UUID,
        .credentials.authentication.password = CONFIG_CLIENT_TOKEN,
    };
#if CONFIG_BROKER_URL_FROM_STDIN
    char line[128];

    if (strcmp(mqttCfg.broker.address.uri, "FROM_STDIN") == 0)
    {
        int count = 0;
        printf("Please enter url of mqtt broker\n");
        while (count < 128)
        {
            int c = fgetc(stdin);
            if (c == '\n')
            {
                line[count] = '\0';
                break;
            }
            else if (c > 0 && c < 127)
            {
                line[count] = c;
                ++count;
            }
            vTaskDelay(10 / portTICK_PERIOD_MS);
        }
        mqttCfg.broker.address.uri = line;
        printf("Broker url: %s\n", line);
    }
    else
    {
        ESP_LOGE(MQTT_EVENT_BEFORE_CONNECT, "Configuration mismatch: wrong broker url");
        abort();
    }
#endif /* CONFIG_BROKER_URL_FROM_STDIN */

    mqttClient = esp_mqtt_client_init(&mqttCfg);

    /* The last argument may be used to pass data to the event handler, in this example mqtt_event_handler */
    esp_mqtt_client_register_event(mqttClient, MQTT_EVENT_ANY, mqttEventHandler, NULL);

    esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("mqtt_client", ESP_LOG_VERBOSE);
    esp_log_level_set("TRANSPORT_BASE", ESP_LOG_VERBOSE);
    esp_log_level_set("esp-tls", ESP_LOG_VERBOSE);
    esp_log_level_set("TRANSPORT", ESP_LOG_VERBOSE);
    esp_log_level_set("outbox", ESP_LOG_VERBOSE);

    esp_mqtt_client_start(mqttClient);
}

/*
 * @brief Event handler registered to receive MQTT events
 *
 *  This function is called by the MQTT client event loop.
 *
 * @param handlerArgs user data registered to the event.
 * @param base Event base for the handler(always MQTT Base in this example).
 * @param eventId The id for the received event.
 * @param event_data The data for the event, esp_mqtt_event_handle_t.
 */
static void mqttEventHandler(void *handlerArgs, esp_event_base_t base, int32_t eventId, void *eventData)
{
    ESP_LOGD(MQTT_TAG, "Event dispatched from event loop base=%s, eventId=%" PRIi32 "", base, eventId);

    esp_mqtt_event_handle_t event = eventData;
    // esp_mqtt_client_handle_t client = event->client;

    switch ((esp_mqtt_event_id_t)eventId)
    {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(MQTT_TAG, "MQTT connected");
        mqttHandleEventConnected(event);
        break;
    case MQTT_EVENT_DISCONNECTED:
        // TODO reconnect
        ESP_LOGI(MQTT_TAG, "MQTT disconnected");
        break;
    case MQTT_EVENT_SUBSCRIBED:
        // TODO start publishing device data
        ESP_LOGI(MQTT_TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_UNSUBSCRIBED:
        // TODO stop publishing device data
        ESP_LOGI(MQTT_TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_PUBLISHED:
        ESP_LOGD(MQTT_TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGD(MQTT_TAG, "MQTT_EVENT_DATA");
        ESP_LOGD(MQTT_TAG, "TOPIC=%.*s\r\n", event->topic_len, event->topic);
        ESP_LOGD(MQTT_TAG, "DATA=%.*s\r\n", event->data_len, event->data);

        /* TODO subscribe to device topics after recevining client config */
        CmlHandler_HandlePayload(event->data, event->data_len);

        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGW(MQTT_TAG, "MQTT_EVENT_ERROR");
        if (event->error_handle->error_type == MQTT_ERROR_TYPE_TCP_TRANSPORT)
        {
            mqttLogNonZeroError("reported from esp-tls", event->error_handle->esp_tls_last_esp_err);
            mqttLogNonZeroError("reported from tls stack", event->error_handle->esp_tls_stack_err);
            mqttLogNonZeroError("captured as transport's socket errno", event->error_handle->esp_transport_sock_errno);
            ESP_LOGI(MQTT_TAG, "Last errno string (%s)", strerror(event->error_handle->esp_transport_sock_errno));
        }
        break;
    default:
        ESP_LOGI(MQTT_TAG, "Other event id:%d", event->event_id);
        break;
    }
}

static void mqttLogNonZeroError(const char *message, int error_code)
{
    if (error_code != 0)
    {
        ESP_LOGE(MQTT_TAG, "Last error %s: 0x%x", message, error_code);
    }
}

static void mqttHandleEventConnected(esp_mqtt_event_handle_t event)
{
    esp_mqtt_client_handle_t client = event->client;
    size_t size;

    /* Set client status */
    TopicBuilder_init(&mqttTopicBuilder);
    TopicBuilder_appendRoute(&mqttTopicBuilder, TOPICBUILDER_ROUTE_USER, CONFIG_USER_UUID, sizeof(CONFIG_USER_UUID));
    TopicBuilder_appendRoute(&mqttTopicBuilder, TOPICBUILDER_ROUTE_CLIENT, CONFIG_CLIENT_UUID, sizeof(CONFIG_CLIENT_UUID));
    TopicBuilder_setClientTopic(&mqttTopicBuilder, TOPICBUILDER_CLIENTTOPIC_STATUS);
    size = CmlHandler_BuildSetClientStatusPayload(mqttPayloadBuffer, MQTT_PAYLOAD_BUFFER_SIZE);
    esp_mqtt_client_publish(client, mqttTopicBuilder.Buffer, (const char *)mqttPayloadBuffer, size, MQTT_QOS_1, MQTT_RETAIN_TRUE);
    ESP_LOGI(MQTT_TAG, "Set client status on topic %s", mqttTopicBuilder.Buffer);

    /* TODO set last will and testament */

    /* Subscribe to client config topic */
    TopicBuilder_init(&mqttTopicBuilder);
    TopicBuilder_appendRoute(&mqttTopicBuilder, TOPICBUILDER_ROUTE_USER, CONFIG_USER_UUID, sizeof(CONFIG_USER_UUID));
    TopicBuilder_appendRoute(&mqttTopicBuilder, TOPICBUILDER_ROUTE_CLIENT, CONFIG_CLIENT_UUID, sizeof(CONFIG_CLIENT_UUID));
    TopicBuilder_setClientTopic(&mqttTopicBuilder, TOPICBUILDER_CLIENTTOPIC_CONFIG);
    esp_mqtt_client_subscribe(client, mqttTopicBuilder.Buffer, MQTT_QOS_1);
    ESP_LOGI(MQTT_TAG, "Subscribed to client config topic %s", mqttTopicBuilder.Buffer);

    /* Get client config */
    size = CmlHandler_BuildGetClientConfigPayload(mqttPayloadBuffer, MQTT_PAYLOAD_BUFFER_SIZE, CONFIG_CLIENT_UUID, CONFIG_CLIENT_TOKEN);
    esp_mqtt_client_publish(client, CONFIG_TOPIC, (const char *)mqttPayloadBuffer, size, MQTT_QOS_1, MQTT_RETAIN_FALSE);
    ESP_LOGI(MQTT_TAG, "Getting client config from topic %s", CONFIG_TOPIC);
}
