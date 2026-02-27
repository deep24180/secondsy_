import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { corsOriginResolver } from './lib/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOriginResolver,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
