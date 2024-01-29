import { IsOptional, IsNumber, IsString, MaxLength } from "class-validator";
export class UpdateAccountSettingsDto {
	
	@IsOptional()
	@IsString()
	fname: string;
	
	@IsOptional()
	@IsString()
	lname: string;
	
	@IsOptional()
	@IsString()
	email: string;

	@IsOptional()
	@IsString()
	phone: string;

	@IsOptional()
	@IsString()
	phoneCountry: string;

	@IsOptional()
	@IsString()
	currentpre: string;

	@IsOptional()
	@IsString()
	city: string;

	@IsOptional()
	@IsString()
	location: string;

	@IsOptional()
	@IsNumber()
	email_verified: number;

	@IsOptional()
	@IsNumber()
	phone_verified: number;

}