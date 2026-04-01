import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.GATEWAY_PORT ?? 8080;
  await app.listen(port);
  console.log(`API Gateway listening on port ${port}`);
}
bootstrap();
