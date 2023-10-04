export class Subscriber {
    constructor(onData = (topic, data) => { }, onSubscribe = topic => { }, onUnsubscribe = topic => { }) {
        this.onData = onData
        this.onSubscribe = onSubscribe
        this.onUnsubscribe = onUnsubscribe
    }
}

class Topic {
    constructor(name) {
        this.name = name
        this.subscribers = []
    }

    addSubcriber = subscriber => {
        if (!this.subscribers.includes(subscriber)) {
            this.subscribers.push(subscriber)
            subscriber.onSubscribe(this.name)
        }
    }

    removeSubscriber = subscriber => {
        this.subscribers = this.subscribers.filter(s => {
            if (s === subscriber) {
                s.onUnsubscribe(this.name)
                return false
            }
            else {
                return true
            }
        })
    }

    notifySubscribers = data => {
        this.subscribers.forEach(subscriber => {
            subscriber.onData(this.name, data)
        })
    }
}

export class Broker {
    constructor() {
        this.topics = {}
    }

    addTopic = (topic) => {
        if (!(topic in this.topics)) {
            this.topics[topic] = new Topic(topic)
        }
    }

    subscribe = (subscriber, topic) => {
        this.addTopic(topic)
        this.topics[topic].addSubcriber(subscriber)
    }

    unsubscribe = (subscriber, topic) => {
        if (topic in this.topics) {
            this.topics[topic].removeSubscriber(subscriber)
        }
    }

    publish = (topic, data) => {
        this.addTopic(topic)
        this.topics[topic].notifySubscribers(data)
    }
}
