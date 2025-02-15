import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Connection, Channel, connect, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from './interfaces/rabbitmq-config.interface';
import { RABBITMQ_CONFIG } from './constants';
import { ExchangeType } from './enums/exchange-type.enum';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private connection: Connection;
    private channel: Channel;
    private readonly logger = new Logger(RabbitMQService.name);
    private initialized = false;

    constructor(
        @Inject(RABBITMQ_CONFIG)
        private readonly config: RabbitMQConfig,
    ) { }

    async onModuleInit() {
        try {
            await this.connect();
            this.initialized = true;
            this.logger.log('RabbitMQ connection initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize RabbitMQ connection', error.stack);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect() {
        try {
            this.connection = await connect(this.config.uri);
            this.channel = await this.connection.createChannel();

            // Handle connection events
            this.connection.on('error', (err) => {
                this.logger.error('RabbitMQ connection error', err.stack);
            });

            this.connection.on('close', async () => {
                this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
                await this.reconnect();
            });

        } catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', error.stack);
            throw error;
        }
    }

    private async reconnect() {
        try {
            await this.connect();
            this.logger.log('Successfully reconnected to RabbitMQ');
        } catch (error) {
            this.logger.error('Failed to reconnect to RabbitMQ', error.stack);
            // Attempt to reconnect after a delay
            setTimeout(() => this.reconnect(), 5000);
        }
    }

    private async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.initialized = false;
        } catch (error) {
            this.logger.error('Error during disconnect', error.stack);
            throw error;
        }
    }

    private async ensureConnection() {
        if (!this.initialized || !this.channel) {
            await this.connect();
        }
    }

    async createExchange(
        exchangeName: string,
        type: ExchangeType,
        options: any = { durable: true },
    ) {
        await this.ensureConnection();
        try {
            await this.channel.assertExchange(exchangeName, type, options);
            this.logger.log(`Exchange ${exchangeName} created successfully`);
        } catch (error) {
            this.logger.error(`Failed to create exchange ${exchangeName}`, error.stack);
            throw error;
        }
    }

    async createQueue(
        queueName: string,
        options: any = { durable: true },
    ) {
        await this.ensureConnection();
        try {
            return await this.channel.assertQueue(queueName, options);
        } catch (error) {
            this.logger.error(`Failed to create queue ${queueName}`, error.stack);
            throw error;
        }
    }

    async bindQueue(
        queueName: string,
        exchangeName: string,
        routingKey: string = '',
    ) {
        await this.ensureConnection();
        try {
            await this.channel.bindQueue(queueName, exchangeName, routingKey);
            this.logger.log(`Queue ${queueName} bound to exchange ${exchangeName}`);
        } catch (error) {
            this.logger.error(`Failed to bind queue ${queueName}`, error.stack);
            throw error;
        }
    }

    async publish(
        exchangeName: string,
        routingKey: string,
        content: any,
        options: any = {},
    ) {
        await this.ensureConnection();
        try {
            const buffer = Buffer.from(JSON.stringify(content));
            const result = this.channel.publish(exchangeName, routingKey, buffer, options);
            if (result) {
                this.logger.debug(`Message published to ${exchangeName}`);
            }
            return result;
        } catch (error) {
            this.logger.error(`Failed to publish message to ${exchangeName}`, error.stack);
            throw error;
        }
    }

    async subscribe(
        queueName: string,
        handler: (message: any) => Promise<void>,
        options: any = {},
    ) {
        await this.ensureConnection();
        try {
            await this.channel.consume(
                queueName,
                async (message: ConsumeMessage | null) => {
                    if (!message) return;

                    try {
                        const content = JSON.parse(message.content.toString());
                        await handler(content);
                        this.channel.ack(message);
                    } catch (error) {
                        this.logger.error(`Error processing message from ${queueName}`, error.stack);
                        this.channel.nack(message);
                    }
                },
                options,
            );
            this.logger.log(`Subscribed to queue ${queueName}`);
        } catch (error) {
            this.logger.error(`Failed to subscribe to queue ${queueName}`, error.stack);
            throw error;
        }
    }
}