set(sources "client/config.pb.c" "client/inner_payload.pb.c" "client/status.pb.c")
set(sources "common/config.pb.c" "common/log.pb.c" "common/status.pb.c")
set(sources "device/action.pb.c" "device/config.pb.c" "device/inner_payload.pb.c")
set(sources "payload.pb.c" "pb_common.c" "pb_decode.c" "pb_encode.c")
set(includes "./" "client/" "common/" "device/")

idf_component_register(SRCS ${sources} INCLUDE_DIRS ${includes})
