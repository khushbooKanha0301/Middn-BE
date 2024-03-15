import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
@Schema()
export class ReportUsers {
	@Prop()
	report_from_user_address: string;
	@Prop()
	report_to_user_address: string;
	@Prop()
	userStatus: boolean;
	@Prop()
	reason: string;
	@Prop()
	created_at: string;
}	
export const ReportUsersSchema = SchemaFactory.createForClass(ReportUsers);