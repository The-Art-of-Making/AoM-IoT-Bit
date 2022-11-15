# client init connection
# 0x00, 0xAA, type, crc (2 bytes), client uuid, device key, ip

# server conf send
# 0x00, 0xFF, type, crc (2 bytes), server addr, server port

# TODO generate CRCs
CRC = 0xFFFF

# lengths
HEADER_LENGTH = 5
INIT_DATA_LENGTH = 76

# formats
HEADER_FORMAT = "=HBH"
INIT_DATA_FORMAT = "=36s36sI"
CONF_SEND_FORMAT = HEADER_FORMAT + "IH"
# H - header, unsigned short, 2 bytes
# B - type, unsigned char, 1 byte
# H - CRC, unsigned short, 2 bytes
# 36s - client uuid, char[], 36 bytes
# 36s - device key, char[], 36 bytes
# I - ip addr, unsigned int, 4 bytes

# headers
CLIENT_HEADER = 0x00AA
SERVER_HEADER = 0x00FF

# data types
INIT = 0x00
CONF_SEND = 0x01
CONF_ACK_SUCCESS = 0x02
CONF_ACK_FAILED = 0x03
TERM = 0x04
