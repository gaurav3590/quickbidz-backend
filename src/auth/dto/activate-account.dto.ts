import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateAccountDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
