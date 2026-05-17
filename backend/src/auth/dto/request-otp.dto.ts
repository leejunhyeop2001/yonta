import { IsEmail, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  @Matches(/@yonsei\.ac\.kr$/i, {
    message: 'Only Yonsei student email domain is allowed.',
  })
  email!: string;
}

