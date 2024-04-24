import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
@Schema()
export class BlockUsers {
	@Prop()
	block_from_user_address: string;
	@Prop()
	block_to_user_address: string;
	@Prop()
	userStatus: boolean;
	@Prop()
	created_at: string;
}	
export const BlockUsersSchema = SchemaFactory.createForClass(BlockUsers);
  