import { createClient } from "redis";

export default class RedisDB {
    private _client: ReturnType<typeof createClient>;

    private constructor(redisDBOptions: Record<string, any>) {
        this._client = createClient(redisDBOptions);

        this._client.on('error', function (err: Error) {
            console.error('Error from Redis:', err);
        });

        this._client.on('ready', function () {
            console.log('Redis client is ready!');
        });

        const signals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const;
        signals.forEach((signal) => {
            process.on(signal, async () => {
                await this.disconnect();
                process.exit(0);
            });
        });
    }

    get client() {
        return this._client;
    }

    public async connect() {
        this._client.connect().catch(console.error);
    }

    public async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
        try {
            await this._client.set(key, value);
            if (expirationSeconds) {
                await this._client.expire(key, expirationSeconds);
            }
        } catch (error) {
            console.error('Error setting key in Redis:', error);
            throw error;
        }
    }

    public async get(key: string): Promise<string | null> {
        try {
            return await this._client.get(key);
        } catch (error) {
            console.error('Error getting key from Redis:', error);
            throw error;
        }
    }

    public async has(key: string): Promise<boolean> {
        try {
            const exists = await this._client.exists(key);
            return exists === 1;
        } catch (error) {
            console.error('Error checking if key is in Redis:', error);
            throw error;
        }
    }

    public async del(key: string): Promise<void> {
        try {
            await this._client.del(key);
        } catch (error) {
            console.error('Error deleting key in Redis:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this._client.quit();
            console.log('Redis connection closed');
        } catch (error) {
            console.error('Error closing Redis connection:', error);
            throw error;
        }
    }
}

