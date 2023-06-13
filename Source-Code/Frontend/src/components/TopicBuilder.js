export const deviceTopics = {
    state: "state",
    cmd: "cmd",
    status: "status"
}

export const clientTopics = {
    devices: "devices",
    status: "status"
}

class Topic {
    constructor(topic) {
        this.topic = (topic.length > 0) ? topic : ""
    }
    append = value => {
        this.topic += value
        this.topic += "/"
        return this
    }
    getTopic = () => {
        return this.topic
    }
}

export const clientTopicBuilder = (user_uuid, client_uuid, client_topic) => {
    let topic = new Topic("")
    topic
        .append("users")
        .append(user_uuid)
        .append("clients")
        .append(client_uuid)
        .append(client_topic)
    return topic.getTopic()
}

export const deviceTopicBuidler = (user_uuid, client_uuid, device_uuid, device_topic) => {
    let topic = new Topic(clientTopicBuilder(user_uuid, client_uuid, clientTopics.devices))
    topic
        .append(device_uuid)
        .append(device_topic)
    return topic.getTopic()
}