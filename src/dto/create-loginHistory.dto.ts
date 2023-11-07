import { IsOptional, IsNumber, IsString, MaxLength } from "class-validator";
export class CreateLoginHistoryDto {
	@IsString()
	user_id: string;
	
	@IsString()
	wallet_address: string;

    @IsString()
	ip_address: string;

	@IsString()
	location: string;

    @IsString()
	browser: string;

    @IsString()
    login_at: string;
}