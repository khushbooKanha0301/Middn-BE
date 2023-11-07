import { IsOptional, IsNumber, IsString, MaxLength } from "class-validator";
export class UpdateUserProfileDto {
    @IsOptional()
	@IsString()
	fname_alias: string;
	
	@IsOptional()
	@IsString()
	lname_alias: string;

    @IsOptional()
    @IsString()
    updatedAt: string;

	@IsOptional()
	@IsString()
	bio: string;

	@IsOptional()
	profile: Express.Multer.File;

	@IsOptional()
	is_profile_deleted:Boolean;
	
	@IsOptional()
	@IsString()
	nonce: string;

	@IsOptional()
	@IsString()
	is_2FA_login_verified: string;

	@IsOptional() 
	@IsString() 
	last_login_at: string;
}