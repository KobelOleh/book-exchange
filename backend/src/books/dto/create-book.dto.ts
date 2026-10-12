import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  author: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  photoUrl: string;
}
