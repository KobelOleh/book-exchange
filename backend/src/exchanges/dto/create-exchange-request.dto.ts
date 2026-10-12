import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
} from 'class-validator';

export class CreateExchangeRequestDto {
  @IsUUID()
  requestedBookId: string;

  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  offeredBookIds: string[];
}
