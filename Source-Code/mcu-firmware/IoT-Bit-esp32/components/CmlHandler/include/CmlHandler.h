#include <stddef.h>

size_t CmlHandler_BuildSetClientStatusPayload(unsigned char *buffer, size_t size);
size_t CmlHandler_BuildGetClientConfigPayload(unsigned char *buffer, size_t size, char *const uuid, char *const token);
void CmlHandler_HandlePayload(const char *data, const unsigned int length);
