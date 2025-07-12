import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  private readonly logger = new Logger(MongooseConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    const uri = this.configService.get<string>('MONGODB_URI');

    if (!uri) {
      this.logger.error(
        '❌ MONGODB_URI is not defined in environment variables!',
      );
      throw new Error('MONGODB_URI is not set');
    }

    const dbNameMatch = uri.match(/\/([^/?]+)/); // Extract database name
    const dbName = dbNameMatch ? dbNameMatch[1] : 'unknown';

    this.logger.log(`✅ Connecting to MongoDB`);
    this.logger.log(`🌐 URI: ${uri}`);

    return {
      uri,
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          this.logger.log('✅ Successfully connected to MongoDB');
        });

        connection.on('error', (err) => {
          this.logger.error('❌ MongoDB connection error', err);
        });

        return connection;
      },
    };
  }
}
