import { IsOptional, IsString, IsBoolean , IsNumber} from "class-validator";

export class CreateTradeDto {

  @IsOptional()
  @IsString()
  user_address: string;

  @IsOptional()
  @IsString()
  escrow_id: string;

  @IsOptional()
  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  crypto_currency: string;

  @IsOptional()
  @IsString()
  country_currency: string;

  @IsOptional()
  @IsString()
  conversation_amount: number;

  @IsOptional()
  @IsNumber()
  trade_status: number;

  @IsOptional()
  @IsString()
  trade_address: string;

  @IsOptional()
  @IsString()
  escrow_type: string;

  @IsOptional()
  @IsString()
  createdAt: string;

  @IsOptional()
  @IsBoolean()
  updatedAt: string;
}
