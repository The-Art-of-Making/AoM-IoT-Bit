set(sources "src")
set(includes "include")

idf_component_register(SRCS ${sources} INCLUDE_DIRS ${includes} PRIV_REQUIRES driver)
