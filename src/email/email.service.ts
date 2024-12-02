import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SendEmailDto } from './dto/sendEmail.dto';
import { createTransport } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { verificationCodeEmailDto } from './dto/verificationCodeEmail.dto';
import { generateVerificationCode } from '../util/code-generator-util';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendEmailAndCode({ email }: SendEmailDto): Promise<void> {
    const code = generateVerificationCode();

    try {
      // Actualiza el token y la fecha de expiración en la base de datos
      await this.prisma.userSecurity.update({
        where: { email },
        data: {
          emailToken: code,
          emailTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } catch (error) {
      // Manejo de errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // El código P2025 indica que no se encontró el registro
          throw new NotFoundException('El correo proporcionado no existe');
        }
      }
      // Error genérico
      this.logger.error(
        'Error actualizando el token en la base de datos:',
        error.message,
      );
      throw new InternalServerErrorException('Error actualizando el token');
    }

    try {
      // Envía el correo de verificación
      await this.sendVerificationEmail(email, code);
    } catch (error) {
      // El error ya está siendo manejado en sendVerificationEmail
      throw error;
    }
  }

  async reSendEmailAndCode({ email }: SendEmailDto): Promise<void> {
    const code = generateVerificationCode();

    // revisar si ya al menos gasto el primer intento de envio sino no es un reenvio.
    const user = await this.prisma.userSecurity.findFirst({
      where: { email },
    });

    if (user.emailIsVerified) {
      throw new ConflictException('Email validado.');
    }

    if (user.emailResendCount === 0) {
      throw new ConflictException(
        'Error al reenviar el email, todavia no intentaste registrarte o no gastante nigun intento',
      );
    }

    if (user.emailResendCount === 3) {
      throw new ConflictException(
        'Error al reenviar el email, gastaste todos tus intentos diarios. Volve a intentar mañana.',
      );
    }

    await this.prisma.userSecurity.update({
      where: { email },
      data: {
        emailToken: code,
        emailTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        emailResendCount: user.emailResendCount + 1,
      },
    });
    await this.sendVerificationEmail(email, code);
  }

  private async sendVerificationEmail(
    email: string,
    code: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: email,
        subject: 'Valida tu correo',
        html: `<b>Tu código de verificación es: ${code}</b>`,
      });
      this.logger.debug(`Email sent: ${info.messageId}`);
    } catch (error) {
      // Manejo de errores específicos del envío de email
      if (error.responseCode === 550) {
        throw new BadRequestException('Dirección de correo no válida');
      }

      // Manejo de errores genéricos
      this.logger.error('Error enviando email:', error.message);
      throw new ServiceUnavailableException(
        'Error al enviar el email, intenta más tarde',
      );
    }
  }

  async verificationCodeEmail({
    code,
    userId,
  }: verificationCodeEmailDto): Promise<string> {
    const { userSecurity } = await this.getUserAndSecurity(userId);

    if (userSecurity.emailIsVerified) {
      throw new ConflictException('Token is verified, retry for 24hs');
    }

    if (userSecurity.emailToken !== code) {
      throw new ConflictException('Invalid verification code');
    }

    if (
      userSecurity.emailTokenExpiresAt &&
      new Date() > userSecurity.emailTokenExpiresAt
    ) {
      throw new ConflictException('Verification code has expired');
    }

    await this.prisma.userSecurity.update({
      where: { userId },
      data: { emailIsVerified: true, isAccountActive: true },
    });

    return 'Verification successful';
  }

  private async getUserAndSecurity(userId: number) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new ConflictException('User not found');

    const userSecurity = await this.prisma.userSecurity.findFirst({
      where: { userId },
    });
    if (!userSecurity) throw new ConflictException('User security not found');

    return { user, userSecurity };
  }
}
