import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
@Schema()
export class LoginHistory {
	@Prop()
	user_id: string;
	@Prop()
	wallet_address: string;
	@Prop()
	ip_address: string;
	@Prop()
	location: string;
	@Prop()
	browser: string;
	@Prop()
	login_at: string;
}	
export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);