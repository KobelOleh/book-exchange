import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/authenticated-user.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { Page } from '../common/page.js';
import { BookWithOwner, BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { ListBooksQueryDto } from './dto/list-books-query.dto.js';

@Controller('books')
export class BooksController {
  constructor(@Inject(BooksService) private readonly books: BooksService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { search, mine, page, limit }: ListBooksQueryDto,
  ): Promise<Page<BookWithOwner>> {
    return this.books.list({
      search,
      ownerId: mine ? user.id : undefined,
      page,
      limit,
    });
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<BookWithOwner> {
    return this.books.findById(id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookDto,
  ): Promise<BookWithOwner> {
    return this.books.create(user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.books.remove(user, id);
  }
}
