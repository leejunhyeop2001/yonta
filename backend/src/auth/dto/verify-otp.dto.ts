import { IsEmail, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @Matches(/@yonsei\.ac\.kr$/i, {
    message: 'Only Yonsei student email domain is allowed.',
  })
  email!: string;

  // A안: 6-digit numeric OTP
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number.' })
  otp!: string;
}

