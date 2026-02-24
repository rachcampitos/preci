import { IsEmail, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'El email no es valido' })
  email: string;

  @Length(6, 6, { message: 'El codigo debe tener exactamente 6 digitos' })
  otp: string;
}
