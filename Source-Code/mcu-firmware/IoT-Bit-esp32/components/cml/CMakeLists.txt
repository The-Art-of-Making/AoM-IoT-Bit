set(sources "client/client_config.pb.c" "client/client_inner_payload.pb.c" "client/client_status.pb.c"
            "common/config.pb.c" "common/log.pb.c" "common/status.pb.c"
            "device/device_action.pb.c" "device/device_config.pb.c" "device/device_inner_payload.pb.c"
            "payload.pb.c" "pb_common.c" "pb_decode.c" "pb_encode.c")
set(includes "./" "client/" "common/" "device/")

idf_component_register(SRCS ${sources} INCLUDE_DIRS ${includes})
