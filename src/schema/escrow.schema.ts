import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
@Schema()
export class Escrow {
  @Prop()
  user_address: string;
  @Prop()
  user_id: string;
  @Prop()
  escrow_type: string;
  @Prop()
  price_type: string;
  @Prop()
  fixed_price: string;
  @Prop()
  flex_min_price: string;
  @Prop()
  flex_max_price: string;
  @Prop()
  category: string;
  @Prop()
  object: string;
  @Prop()
  description: string;
  @Prop()
  time_constraints: string;
  @Prop()
  transaction_number: string;
  @Prop()
  is_deleted: boolean;
  @Prop()
  createdAt: string;
  @Prop()
  updatedAt: string;
}
export const EscrowSchema = SchemaFactory.createForClass(Escrow);
