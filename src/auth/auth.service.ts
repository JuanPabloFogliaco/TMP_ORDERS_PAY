import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from 'src/email/email.service';
import { UserSecurityService } from './user-security.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly userSecurityService: UserSecurityService, // Nuevo servicio
  ) {}

  async validateUser(email: string, password: string): Promise<boolean> {
    try {
      const userSecurity = await this.userSecurityService.findByEmail(email);
      if (!userSecurity) return false;

      const isPasswordValid = await bcrypt.compare(
        password,
        userSecurity.password,
      );
      if (!isPasswordValid)
        throw new UnauthorizedException('Contraseña inválida');

      if (!userSecurity.emailIsVerified)
        throw new ForbiddenException('Cuenta no verificada');

      if (!userSecurity.isAccountActive)
        throw new ForbiddenException('Cuenta inactiva.');

      return isPasswordValid;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno del servidor.',
        error,
      );
    }
  }

  async login({ email, password }: LoginDto) {
    try {
      await this.validateUser(email, password);
      const user = await this.userSecurityService.findByEmail(email);
      if (!user)
        throw new ConflictException(
          'No se encontro el usuario atraves del email',
        );
      const access_token = this.jwtService.sign({ email, sub: user.userId });
      await this.userSecurityService.createSession(user.userId, access_token);
      return { access_token };
    } catch (error) {
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async register(dto: RegisterDto) {
    this.userSecurityService.validateEmailFormat(dto.email);
    await this.userSecurityService.ensureEmailIsUnique(dto.email);

    await this.userSecurityService.createUser(dto);

    await this.emailService.sendEmailAndCode({ email: dto.email });
    return { message: 'Registro exitoso. Verifica tu email.' };
  }
}
