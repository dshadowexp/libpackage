import { Kafka, logLevel, Consumer, Partitioners, Producer, EachMessagePayload} from "kafkajs";

export interface KafkaProcessorMessage {
    key: string | undefined,
    message: any
}

export class KafkaClient {
    private static _instance: KafkaClient;
    private _client: Kafka | undefined;

    private constructor() {}

    public static getInstance(): KafkaClient {
        if (!KafkaClient._instance) {
            KafkaClient._instance = new KafkaClient();
        }
        return KafkaClient._instance;
    }

    public initialize(clientId: string, brokers: string[]) {
        this._client = new Kafka({
            clientId: clientId,
            brokers: brokers,
            logLevel: logLevel.INFO
        });
    }

    public get client() {
        if (!this._client) {
            throw new Error(`Kafka Client has not been initialized`);
        }

        return this._client;
    }
}

export class KafkaProducer {
    private producer: Producer;

    constructor(kafkaClient: Kafka) {
        this.producer = kafkaClient.producer({ 
            createPartitioner: Partitioners.DefaultPartitioner 
        });
    }

    async sendMessage(topic: string, message: any): Promise<void> {
        await this.producer.connect();
        await this.producer.send({
            topic: topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        await this.producer.disconnect();
    }
}

export class KafkaConsumer {
    private _consumer: Consumer;
    private _subs: Record<string, KafkaMessageProcessor>;

    constructor(kafkaClient: Kafka, groupId: string) {
        this._subs = {}
        this._consumer = kafkaClient.consumer({ groupId });
        this._consumer.connect()
            .then(() => {
                console.log(`Kafka Consumer connected to group ${groupId}`); 
            })
    }

    public async subscribe(topic: string, processor: KafkaMessageProcessor) {
        this._subs[topic] = processor;
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

                const data: KafkaProcessorMessage = {
                    key: message.key?.toString(),
                    message: JSON.parse(message.value!.toString())
                }
                
                const topicMessageProcessor = this._subs[topic];

                if (topicMessageProcessor) {
                    topicMessageProcessor.processMessage(data);
                }
            }
        });
    }

    public async destroy() {
        await this._consumer?.disconnect();
    }
}

export abstract class KafkaMessageProcessor {
    protected constructor(public readonly topic: string) {}

    abstract validateMessage(message: any): boolean;
    abstract processMessage(message: KafkaProcessorMessage): Promise<void>
}