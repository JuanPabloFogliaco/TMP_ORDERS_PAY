import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class verificationCodeEmailDto {
  @ApiProperty({
    description: 'Codigo de validacion',
    example: 'AXC123',
  })
  @IsString()
  @MinLength(6, {
    message: 'El codigo de validacion debe tener al menos 6 caracteres',
  })
  code: string;

  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
  })
  @IsOptional()
  userId?: number;
}
