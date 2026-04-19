import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { useContainer } from 'class-validator';
import multipart from '@fastify/multipart';
import fastifyRawBody from 'fastify-raw-body';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    {
      // Désactiver le logger interne de NestJS :
      // MonitoringLoggerService sera utilisé comme logger global (app.useLogger)
      // et sera le seul à écrire dans la console.
      // logger: false,
      logger: ['error', 'warn', 'log'],
    },
  );
  app.useWebSocketAdapter(new IoAdapter(app));

  // Permettre à class-validator d'utiliser l'injection de dépendances de NestJS
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Register @fastify/multipart plugin
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10,
    },
  });

  // Register fastify-raw-body to access the raw request body for webhooks
  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false, // Apply to all routes
    routes: [], // Or apply to specific routes
  });
  // Activer CORS avec des options spécifiques
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_HOST
        ? process.env.ALLOWED_HOST.split(',').map((o) => o.trim())
        : [];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
    }),
  );

  // Middleware de logging global (désactivé en production)
  // app.use((req: any, res: any, next: any) => {
  //   console.log(`🌐 REQUÊTE: ${req.method} ${req.url}`);
  //   console.log(`🔑 Authorization: ${req.headers.authorization ? 'PRESENT' : 'MISSING'}`);
  //   console.log(`📋 Content-Type: ${req.headers['content-type'] || 'N/A'}`);
  //   next();
  // });
  const config = new DocumentBuilder()
    .setTitle('KOLABO POS Backend API')
    .setDescription(
      `
Welcome to the official API documentation for the KOLABO POS (Point of Sale) backend.
This API provides all the necessary endpoints for the application.

### HTTP Status Codes Summary:
- **200 OK**: Request was successful.
- **201 Created**: Resource was successfully created.
- **400 Bad Request**: The request was unacceptable, often due to missing a required parameter or invalid data.
- **401 Unauthorized**: Authentication is required and has failed or has not yet been provided.
- **403 Forbidden**: The authenticated user does not have the necessary permissions for the resource.
- **404 Not Found**: The requested resource could not be found.
- **500 Internal Server Error**: An unexpected condition was encountered on the server.
- **409 Conflict**: The request could not be completed due to a conflict with the current state of the resource.
- **204 No Content**: The request was successful, but there is no content to return.

Developed by **KOLABO TECH**.
    `,
    )
    .setVersion('1.0')
    .addTag(
      'Authentication',
      'Endpoints for user authentication, registration, and password management.',
    )
    .addTag('Users', 'Endpoints for managing user profiles.')
    .setContact(
      'KOLABO TECH',
      'https://kolabotech.com',
      'contact@kolabotech.com',
    )
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'apiKey')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on : ${await app.getUrl()}`);
}
bootstrap();
