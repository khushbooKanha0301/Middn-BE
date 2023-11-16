import { IsOptional, IsString, IsBoolean } from "class-validator";
export class CreateEscrowDto {
  @IsOptional()
  @IsString()
  user_address: string;

  @IsOptional()
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  escrow_type: string;

  @IsOptional()
  @IsString()
  price_type: string;

  @IsOptional()
  @IsString()
  fixed_price: string;

  @IsOptional()
  @IsString()
  flex_min_price: string;

  @IsOptional()
  @IsString()
  flex_max_price: string;

  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  object: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  time_constraints: string;

  @IsOptional()
  @IsString()
  transaction_number: string;

  @IsOptional()
  @IsString()
  createdAt: string;

  @IsOptional()
  @IsBoolean()
  is_deleted: boolean;
}
