/* Includes
****************************************************************************************************/
#include <stddef.h>
#include <string.h>
#include "TopicBuilder.h"

/* Defines
****************************************************************************************************/

#define TOPICBUILDER_TOPIC_DELIMITER '/'
#define TOPICBUILDER_TOPIC_DELIMITER_SIZE (0x01U)

/* Constants
****************************************************************************************************/

static const char *TopicBuilder_Routes[] = {"users", "clients", "devices"};
static const char *TopicBuilder_ClientTopics[] = {"status", "config"};
static const char *TopicBuilder_DeviceTopics[] = {"status", "state", "cmd"};

/* Function prototypes
****************************************************************************************************/

static void TopicBuilder_append(TopicBuilder_Context_t *const context, const char *const data, const uint16_t size);

/* Function definitions
****************************************************************************************************/

void TopicBuilder_init(TopicBuilder_Context_t *const context)
{
    if (context != NULL)
    {
        context->Size = 0;
    }
}

void TopicBuilder_appendRoute(TopicBuilder_Context_t *const context, const TopicBuilder_Route_t route, char *const data, const uint16_t size)
{
    if (context != NULL && data != NULL)
    {
        uint16_t routeSize = 0;
        switch (route)
        {
        case (TOPICBUILDER_ROUTE_USER):
            routeSize = sizeof(TopicBuilder_Routes[TOPICBUILDER_ROUTE_USER]);
            TopicBuilder_append(context, TopicBuilder_Routes[TOPICBUILDER_ROUTE_USER], routeSize);
            TopicBuilder_append(context, data, size);
            break;
        case (TOPICBUILDER_ROUTE_CLIENT):
            routeSize = sizeof(TopicBuilder_Routes[TOPICBUILDER_ROUTE_CLIENT]);
            TopicBuilder_append(context, TopicBuilder_Routes[TOPICBUILDER_ROUTE_CLIENT], routeSize);
            TopicBuilder_append(context, data, size);
            break;
        case (TOPICBUILDER_ROUTE_DEVICE):
            routeSize = sizeof(TopicBuilder_Routes[TOPICBUILDER_ROUTE_DEVICE]);
            TopicBuilder_append(context, TopicBuilder_Routes[TOPICBUILDER_ROUTE_DEVICE], routeSize);
            TopicBuilder_append(context, data, size);
            break;
        default:
            break;
        }
    }
}

void TopicBuilder_setClientTopic(TopicBuilder_Context_t *const context, const TopicBuilder_ClientTopic_t clientTopic)
{
    uint16_t size = sizeof(TopicBuilder_ClientTopics[clientTopic]);
    TopicBuilder_append(context, TopicBuilder_ClientTopics[clientTopic], size);
}

void TopicBuilder_setDeviceTopic(TopicBuilder_Context_t *const context, const TopicBuilder_DeviceTopic_t deviceTopic)
{
    uint16_t size = sizeof(TopicBuilder_DeviceTopics[deviceTopic]);
    TopicBuilder_append(context, TopicBuilder_DeviceTopics[deviceTopic], size);
}

static void TopicBuilder_append(TopicBuilder_Context_t *const context, const char *const data, const uint16_t size)
{
    if (context != NULL && data != NULL)
    {
        uint16_t totalSize = context->Size + size;
        if (context->Size != 0)
        {
            totalSize += TOPICBUILDER_TOPIC_DELIMITER_SIZE;
        }
        if (totalSize <= context->BufferSize)
        {
            if (context->Size != 0)
            {
                *(context->Buffer + context->Size) = TOPICBUILDER_TOPIC_DELIMITER;
                context->Size++;
            }
            memcpy(context->Buffer, data, size);
            context->Size += size;
        }
    }
}
