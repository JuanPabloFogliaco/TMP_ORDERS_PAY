import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario, debe ser único',
    example: 'usuario@dominio.com',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;
}
