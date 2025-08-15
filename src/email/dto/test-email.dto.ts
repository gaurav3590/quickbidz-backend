import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class TestEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'forgot-password',
    'account-activation',
    'auction-started',
    'participating',
    'winning',
    'losing',
  ])
  emailType: string;
}
