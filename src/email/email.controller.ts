import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { EmailService } from './email.service';
import { SendEmailDto } from './dto/sendEmail.dto';
import { verificationCodeEmailDto } from './dto/verificationCodeEmail.dto';

@Controller('email') // Ruta base para email
export class EmailController {
  constructor(private readonly serviceEmail: EmailService) {}

  // Ruta para envio de emails
  @Post('send-email')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Servicio de envio de email',
    description:
      'Se usa dentro del registrer y resend-email. NO USARLO!',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado exitosamente.',
    schema: {
      example: {
        messagge: 'Email enviado exitosamente',
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
  @ApiConflictResponse({
    description: 'El correo electrónico ya gasto sus intentos diario.',
    schema: {
      example: {
        statusCode: 409,
        message: 'El correo electrónico ya gasto sus intentos diario',
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
  @ApiBody({ type: SendEmailDto }) // Documenta los datos esperados en el cuerpo de la solicitud
  async sendEmail(@Body() body: SendEmailDto) {
    return await this.serviceEmail.sendEmailAndCode(body);
  }

  // Ruta para envio de emails
  @Post('verification-email')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Servicio de verificacion de email',
    description:
      'Servicio para validar el acceso a un email con un codigo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado exitosamente.',
    schema: {
      example: {
        messagge: 'Email enviado exitosamente',
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
  @ApiConflictResponse({
    description: 'El correo electrónico ya gasto sus intentos diario.',
    schema: {
      example: {
        statusCode: 409,
        message: 'El correo electrónico ya gasto sus intentos diario',
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
  @ApiBody({ type: verificationCodeEmailDto }) // Documenta los datos esperados en el cuerpo de la solicitud
  async verificationCodeEmail(
    @Body() { code, userId }: verificationCodeEmailDto,
  ) {
    return await this.serviceEmail.verificationCodeEmail({
      code: code,
      userId: userId,
    });
  }


  //Reenvio de token al email
  @Post('resend-email')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Servicio de reenvio de email',
    description:
      'Servicio para reenviar un email de validacion de acceso al correo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email reenviado exitosamente.',
    schema: {
      example: {
        messagge: 'Email reenviado exitosamente',
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
  @ApiConflictResponse({
    description: 'El correo electrónico ya gasto sus intentos diario.',
    schema: {
      example: {
        statusCode: 409,
        message: 'El correo electrónico ya gasto sus intentos diario',
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
  @ApiBody({ type: SendEmailDto }) // Documenta los datos esperados en el cuerpo de la solicitud
  async reSendEmail(@Body() body: SendEmailDto) {
    return await this.serviceEmail.reSendEmailAndCode(body);
  }
}
