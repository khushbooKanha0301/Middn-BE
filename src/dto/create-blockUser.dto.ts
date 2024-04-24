import { IsOptional, IsBoolean, IsString } from "class-validator";

export class CreateBlockUserDto {
	@IsOptional()
	@IsString()
	block_from_user_address: string;
	
	@IsOptional()
	@IsString()
	block_to_user_address: string;

	@IsOptional()
	@IsBoolean()
	userStatus: boolean;
	
	@IsOptional()
	@IsString()
	created_at: string;
}