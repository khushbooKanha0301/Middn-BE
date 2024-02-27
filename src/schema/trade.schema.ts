import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Trade {

  @Prop()
  user_address: string;

  @Prop()
  escrow_id: string;

  @Prop()
  escrow_type: string;

  @Prop()
  amount: string;

  @Prop()
  crypto_currency: string;

  @Prop()
  country_currency: string;

  @Prop()
  conversation_amount: number;

  @Prop()
  trade_status: number;

  @Prop()
  trade_address: string;

  @Prop()
  createdAt: string;

  @Prop()
  updatedAt: string;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
