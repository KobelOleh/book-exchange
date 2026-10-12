import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_PAGE_LIMIT } from '../../common/page.js';

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

  /** 1-based page number. */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  /** Books per page. */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number;
}
