# @iamnd/nest-rmq

A NestJS module for RabbitMQ integration that provides easy-to-use abstractions for Direct, Fanout, and Topic exchanges.

## Installation

```bash
npm install @iamnd/nest-rmq
```

## Features

- 🚀 Easy integration with NestJS applications
- 🔄 Support for Direct, Fanout, and Topic exchanges
- 🛡️ Built-in connection management and error handling
- 📨 Simple publish/subscribe patterns
- 🔌 Automatic reconnection handling
- 📝 TypeScript support

## Quick Start

### 1. Import RabbitMQModule

```typescript
// app.module.ts
import { RabbitMQModule } from '@iamnd/nest-rmq';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: 'amqp://localhost:5672',
    }),
  ],
})
export class AppModule {}
```

### 2. Publishing Messages

```typescript
// publisher.service.ts
import { Injectable } from '@nestjs/common';
import { RabbitMQService, ExchangeType } from '@iamnd/nest-rmq';

@Injectable()
export class PublisherService {
  private readonly exchangeName = 'orders';

  constructor(private readonly rabbitMQService: RabbitMQService) {
    this.initialize();
  }

  private async initialize() {
    await this.rabbitMQService.createExchange(
      this.exchangeName,
      ExchangeType.DIRECT
    );
  }

  async publishOrder(order: any) {
    await this.rabbitMQService.publish(
      this.exchangeName,
      'order.created',
      order
    );
  }
}
```

### 3. Subscribing to Messages

```typescript
// subscriber.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService, ExchangeType } from '@iamnd/nest-rmq';

@Injectable()
export class SubscriberService implements OnModuleInit {
  private readonly exchangeName = 'orders';
  private readonly queueName = 'order-processing';

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit() {
    // Create queue
    await this.rabbitMQService.createQueue(this.queueName);

    // Bind queue to exchange
    await this.rabbitMQService.bindQueue(
      this.queueName,
      this.exchangeName,
      'order.created'
    );

    // Subscribe to messages
    await this.rabbitMQService.subscribe(
      this.queueName,
      this.handleOrder.bind(this)
    );
  }

  private async handleOrder(message: any) {
    console.log('Received order:', message);
    // Process the order
  }
}
```

## Exchange Types

### Direct Exchange

```typescript
// Direct exchange for point-to-point communication
await rabbitMQService.createExchange('orders', ExchangeType.DIRECT);
```

### Fanout Exchange

```typescript
// Fanout exchange for broadcasting messages to all bound queues
await rabbitMQService.createExchange('notifications', ExchangeType.FANOUT);
```

### Topic Exchange

```typescript
// Topic exchange for pattern-based routing
await rabbitMQService.createExchange('events', ExchangeType.TOPIC);

// Subscribe to specific patterns
await rabbitMQService.bindQueue(
  'audit-queue',
  'events',
  'order.*.success'  // Matches: order.create.success, order.update.success, etc.
);
```

## Configuration

The module accepts the following configuration options:

```typescript
RabbitMQModule.forRoot({
  uri: 'amqp://localhost:5672', // RabbitMQ connection URI
  // Additional options can be added here
});
```

## Error Handling

The module includes built-in error handling and connection management:

- Automatic reconnection on connection loss
- Message acknowledgment handling
- Error logging with NestJS Logger
- Connection event handling

Example error handling in subscribers:

```typescript
await this.rabbitMQService.subscribe(
  queueName,
  async (message) => {
    try {
      await this.processMessage(message);
      // Message is automatically acknowledged on success
    } catch (error) {
      // Message is automatically nack'd on error
      console.error('Error processing message:', error);
    }
  }
);
```

## Best Practices

1. Create exchanges in publishers, not subscribers
2. Use meaningful exchange and queue names
3. Implement proper error handling
4. Use TypeScript interfaces for message types
5. Follow the single responsibility principle

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

ND

## Support

For issues and feature requests, please create an issue on GitHub.

---

Made with ❤️ for the NestJS community.