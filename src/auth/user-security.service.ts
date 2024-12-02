import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.userSecurity.findFirst({ where: { email } });
  }

  validateEmailFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Formato de correo electrónico inválido');
    }
  }

  async ensureEmailIsUnique(email: string): Promise<void> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
  }

  async createUser({ email, password, firstName, lastName }: RegisterDto) {
    const now = new Date();
    const emailExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    try {
      // Hashea la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crea el usuario principal
      const user = await this.prisma.user.create({
        data: { firstName, lastName, createdAt: now },
      });

      // Crea los datos de seguridad del usuario
      await this.prisma.userSecurity.create({
        data: {
          email,
          password: hashedPassword,
          emailToken: this.generateVerificationCode(),
          emailTokenExpiresAt: emailExpiresAt,
          userId: user.id,
          isAccountActive: false,
          phoneResendCount: 0,
          emailResendCount: 1,
        },
      });

      return user;
    } catch (error) {
      // Manejo de errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Error por duplicación de clave única (ej. email duplicado)
          throw new ConflictException('El email ya está registrado');
        }
        // Otros errores conocidos
        throw new BadRequestException('Error en los datos proporcionados');
      }

      // Error genérico: captura otros errores inesperados
      console.error('Error al crear usuario:', error);
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  async createSession(userId: number, token: string) {
    try {
      await this.prisma.userSecurity.update({
        where: { userId },
        data: { isUserOnline: true },
      });

      return await this.prisma.session.create({
        data: { token, userId },
      });
    } catch (error) {
      // Manejo de errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Ejemplo: Error por clave única o violación de restricciones
        if (error.code === 'P2002') {
          throw new ConflictException('Ya existe una sesión con ese token');
        }

        // Otros errores conocidos de Prisma
        throw new BadRequestException('Error en los datos proporcionados');
      }

      // Error genérico: captura otros errores inesperados
      console.error('Error al crear la sesión:', error);
      throw new InternalServerErrorException('No se pudo crear la sesión');
    }
  }

  generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
