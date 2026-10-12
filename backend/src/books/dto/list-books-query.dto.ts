import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListBooksQueryDto {
  /** Matches against the book name or author, case-insensitively. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Restricts the list to the caller's own Books. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mine?: boolean;
}
