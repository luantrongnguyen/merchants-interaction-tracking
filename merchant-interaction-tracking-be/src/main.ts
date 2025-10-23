import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all domains
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Backend server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
