import { DynamicModule, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQConfig } from './interfaces/rabbitmq-config.interface';
import { RABBITMQ_CONFIG } from './constants';

@Module({})
export class RabbitMQModule {
    static forRoot(config: RabbitMQConfig): DynamicModule {
        return {
            module: RabbitMQModule,
            providers: [
                {
                    provide: RABBITMQ_CONFIG,
                    useValue: config,
                },
                RabbitMQService,
            ],
            exports: [RabbitMQService],
            global: true,
        };
    }
}