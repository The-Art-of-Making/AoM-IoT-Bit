#ifndef TOPIC_BUILDER_H
#define TOPIC_BUILDER_H

/* Includes
****************************************************************************************************/
#include <inttypes.h>

/* Type definitions
****************************************************************************************************/

typedef enum
{
    TOPICBUILDER_ROUTE_USER,
    TOPICBUILDER_ROUTE_CLIENT,
    TOPICBUILDER_ROUTE_DEVICE
} TopicBuilder_Route_t;

typedef enum
{
    TOPICBUILDER_CLIENTTOPIC_STATUS,
    TOPICBUILDER_CLIENTTOPIC_CONFIG
} TopicBuilder_ClientTopic_t;

typedef enum
{
    TOPICBUILDER_DEVICETOPIC_STATUS,
    TOPICBUILDER_DEVICETOPIC_STATE,
    TOPICBUILDER_DEVICETOPIC_CMD,
} TopicBuilder_DeviceTopic_t;

typedef struct
{
    char *Buffer;
    uint16_t BufferSize;
    uint16_t Size;
} TopicBuilder_Context_t;

/* Function prototypes
****************************************************************************************************/

void TopicBuilder_init(TopicBuilder_Context_t *const context);
void TopicBuilder_appendRoute(TopicBuilder_Context_t *const context, const TopicBuilder_Route_t route, char *const data, const uint16_t size);
void TopicBuilder_setClientTopic(TopicBuilder_Context_t *const context, const TopicBuilder_ClientTopic_t clientTopic);
void TopicBuilder_setDeviceTopic(TopicBuilder_Context_t *const context, const TopicBuilder_DeviceTopic_t deviceType);

#endif
