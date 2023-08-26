set(sources "src/action.pb.c" "src/client.pb.c" "src/device.pb.c" "src/pb_common.c" "src/pb_decode.c" "src/service_message.pb.c")
set(includes "include")

idf_component_register(SRCS ${sources} INCLUDE_DIRS ${includes})
