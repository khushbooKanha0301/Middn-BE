import { Document } from "mongoose";

export interface ITrade extends Document {

  readonly user_address: string;
  readonly escrow_id: string;
  readonly amount: string;
  readonly crypto_currency: string;
  readonly country_currency: string;
  readonly conversation_amount: string;
  readonly created_at: string;
  readonly updated_at: string;
  
}
