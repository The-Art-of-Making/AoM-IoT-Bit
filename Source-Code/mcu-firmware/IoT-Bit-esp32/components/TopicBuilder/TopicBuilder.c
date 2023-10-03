/* Includes
****************************************************************************************************/
#include <stddef.h>
#include <string.h>
#include "TopicBuilder.h"

/* Defines
****************************************************************************************************/

static char *TopicBuilder_TopicDelimiter = "/";
static char *TopicBuilder_NullTerminator = "\0";

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
        context->Size = 0U;

        if (context->BufferSize > 0U)
        {
            *context->Buffer = *TopicBuilder_NullTerminator;
        }
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
        if (context->Size > 0U)
        {
            strncat(context->Buffer, TopicBuilder_TopicDelimiter, context->BufferSize - context->Size);
            context->Size = strlen(context->Buffer);
        }

        strncat(context->Buffer, data, context->BufferSize - context->Size);
        context->Size = strlen(context->Buffer);
    }
}
