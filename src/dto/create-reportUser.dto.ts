import { IsOptional, IsNumber, IsString, MaxLength } from "class-validator";
export class CreateReportUserDto {
	@IsOptional()
	@IsString()
	report_from_user_address: string;
	
	@IsOptional()
	@IsString()
	report_to_user_address: string;

	@IsOptional()
	@IsString()
	reason: string;
	
	@IsOptional()
	@IsString()
	created_at: string;
}