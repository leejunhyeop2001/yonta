import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginPasswordDto {
  @IsEmail()
  @Matches(/@yonsei\.ac\.kr$/i, {
    message: 'Only Yonsei student email domain is allowed.',
  })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password!: string;
}
