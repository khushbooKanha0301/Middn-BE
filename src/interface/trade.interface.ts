import { Document } from "mongoose";

export interface ITrade extends Document {
  readonly user_address: string;
  readonly escrow_id: string;
  readonly escrow_type: string;
  readonly amount: string;
  readonly crypto_currency: string;
  readonly country_currency: string;
  readonly trade_status: number;
  readonly trade_address: string;
  readonly conversation_amount: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  
}
