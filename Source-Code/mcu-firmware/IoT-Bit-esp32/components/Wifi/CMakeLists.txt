set(sources "Wifi.c")
set(includes "include")

idf_component_register(
    SRCS ${sources}
    INCLUDE_DIRS ${includes}
    REQUIRES esp_wifi
    REQUIRES nvs_flash
)
