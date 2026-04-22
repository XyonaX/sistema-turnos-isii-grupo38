import { IsEmail, IsString, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDTO {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre!: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @MaxLength(150, { message: 'El email no puede superar los 150 caracteres' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una letra y un número',
  })
  password!: string;

  @IsString({ message: 'El rol es requerido' })
  @IsIn(['cliente', 'profesional'], { message: 'El rol debe ser cliente o profesional' })
  rol!: string;
}

export class LoginDTO {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @IsString({ message: 'La contraseña es requerida' })
  @MinLength(1, { message: 'La contraseña es requerida' })
  password!: string;
}
