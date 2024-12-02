import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar ValidationPipe global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API TEMPLATE_BACKEND_1')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth() // Agrega soporte para autenticación con JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/api-docs', app, document); // Rutas de la documentación

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
