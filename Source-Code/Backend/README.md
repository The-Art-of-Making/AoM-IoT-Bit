# AoM Iot Backend

## Prerequisites

- Kubernetes
- Docker
- RabbitMQ
- Nodejs and npm
- python3 and pip
- protoc

## Kubernetes Secrets

Generate Kubernetes secret for MONGOURI container env var from file

`mongo_uri_secret.yaml`

## Compiling protobufs for C and Python

## MQTT Server

- messages should generally sent with QoS 1
    - frequently updated messages can be sent with QoS 0
    - QoS 0: at most once
    - QoS 1: at least once
- config messages should be retained
- clients should use persistent sessions
    - certain flags need to be checked on connection
        - Only re-subscribe to topics if session did not persist