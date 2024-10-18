import { Kafka, logLevel, Consumer, Partitioners, Producer} from "kafkajs";

export default class KafkaService {
    private _kafka: Kafka;
    private _consumer: Consumer | undefined;
    private _producer: Producer;
    private _subs: Record<string, (data: any) => void>;

    constructor(clientId: string, brokers: string[]) {
        this._kafka = new Kafka({
            clientId: clientId,
            brokers: brokers,
            logLevel: logLevel.INFO
        });

        this._producer = this._kafka.producer({ 
            createPartitioner: Partitioners.DefaultPartitioner 
        });

        this._subs = {}

        const signals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const;
        signals.forEach((signal) => {
            process.on(signal, async () => {
                await this.destroy();
                process.exit(0);
            });
        });
    }

    public async initProducer() {
        await this._producer.connect();
        console.log('Kafka Producer successfully connected');
    }

    public async produceMessage(topic: string, payload: object, key?: string) {
        const value = JSON.stringify(payload)
        await this._producer.send({
            topic,
            messages: [{ key, value}],
        });
    }

    public async createConsumer(groupId: string) {
        this._consumer = this._kafka.consumer({ groupId });
        await this._consumer.connect();
        console.log(`Kafka Consumer connected to group ${groupId}`);        
    }

    public async subscribe(topic: string, handler: (data: any) => void) {
        this._subs[topic] = handler;
        await this._consumer?.subscribe({ 
            topic: topic, 
            fromBeginning: false 
        });
        console.log(`Kafka Consumer subscribed to topic ${topic}`);
    }

    public async consumeMessages() {
        await this._consumer!.run({
            eachMessage: async ({ topic, message }) => {
                if (!message || !message.value) {
                    return;
                }

                const data = {
                    key: message.key?.toString(),
                    message: JSON.parse(message.value!.toString())
                }
                
                const topicHandler = this._subs[topic];

                if (topicHandler) {
                    topicHandler(data);
                }
            }
        });
    }

    public async destroy() {
        await this._producer.disconnect();
        await this._consumer?.disconnect();
    }
}