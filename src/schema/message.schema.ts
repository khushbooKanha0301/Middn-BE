import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
@Schema()
export class Message {
	@Prop()
	sender_address: string;
	@Prop()
	receiver_address: string;
	@Prop()
	content: string;
	@Prop({ default: false })
	is_readed: boolean;
	@Prop()
	created_at: Date;
	@Prop()
	updated_at: Date;
	@Prop()
	file: string;
}	
export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.pre('save', function (next) {
	const currentDate = new Date();
	this.updated_at = currentDate;
	if (!this.created_at) {
	  this.created_at = currentDate;
	}
	next();
  });