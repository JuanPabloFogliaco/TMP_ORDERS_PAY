import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('authentication') // Ruta base para autenticación
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Ruta para inicio de sesión
  @Post('login')
  @ApiOperation({
    summary: 'Inicio de sesión de usuario',
    description: 'Valida las credenciales del usuario y retorna un token JWT.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Objeto que contiene las credenciales del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso. Retorna un token de acceso.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Credenciales inválidas o formato incorrecto.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Credenciales inválidas',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Asegura validaciones automáticas del DTO
  @ApiOperation({
    summary: 'User login',
    description: 'Validate user credentials',
  })
  @ApiBody({ type: LoginDto }) // Documenta los datos esperados en el cuerpo de la solicitud
  async login(@Body() body: LoginDto) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }

  // Ruta para registro de usuarios
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Regristo del nuevo usuario',
    description: 'Servicio para registrar un nuevo usuario en la aplicacion.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente.',
    schema: {
      example: {
        email: 'usuario@dominio.com',
        phoneNumber: '543329123456',
        firstName: 'Juan',
        lastName: 'Pérez',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'El formato de los datos enviados no es válido.',
    schema: {
      example: {
        statusCode: 400,
        message: 'El formato del correo es inválido',
        error: 'Bad Request',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'El formato de los datos enviados no es válido.',
    schema: {
      example: {
        statusCode: 400,
        message: 'El formato del telefono es inválido',
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'El correo electrónico ya está registrado.',
    schema: {
      example: {
        statusCode: 409,
        message: 'El correo electrónico ya está registrado',
        error: 'Conflict',
      },
    },
  })
  @ApiConflictResponse({
    description: 'El telefono ya está registrado.',
    schema: {
      example: {
        statusCode: 409,
        message: 'El telefono  ya está registrado',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      },
    },
  })
  @ApiBody({ type: RegisterDto }) // Documenta los datos esperados en el cuerpo de la solicitud
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }
}
