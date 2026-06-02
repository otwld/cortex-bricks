import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createWebsocketIoAdapter } from '@otwld/nest-websocket';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';

/**
 * Start the Nest HTTP and Socket.IO servers.
 *
 * @returns Promise that resolves after the app is listening.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  if (process.env['WS_DEMO_ONLY'] === 'true') {
    app.useWebSocketAdapter(createWebsocketIoAdapter(app));
  }
  let frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
  if (process.env['WS_DEMO_ONLY'] !== 'true') {
    frontendUrl = app.get(ConfigService).get<string>('frontendUrl') ?? frontendUrl;
  }
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on: http://localhost:${port}/api`);
}

bootstrap();
