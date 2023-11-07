import { Optional } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
export class CreateMessageDto {
	@IsOptional()
	@IsString()
	sender_address: string;
	
	@IsNotEmpty()
	@IsString()
	receiver_address: string;

	@Optional()
	@IsString()
	content: string;

	@IsOptional()
	@IsString()
	created_at: string;

	@IsOptional()
	@IsString()
	updated_at: string;

	@IsOptional()
	file: Express.Multer.File;
}

