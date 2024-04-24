import { IsOptional, IsBoolean, IsString } from "class-validator";
export class CreateReportUserDto {
	@IsOptional()
	@IsString()
	report_from_user_address: string;
	
	@IsOptional()
	@IsString()
	report_to_user_address: string;

	@IsOptional()
	@IsBoolean()
	userStatus: boolean;

	@IsOptional()
	@IsString()
	reason: string;
	
	@IsOptional()
	@IsString()
	created_at: string;
}