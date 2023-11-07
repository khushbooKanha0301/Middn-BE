import { Document } from "mongoose";
export interface IEscrows extends Document {
  readonly user_address: string;
  readonly user_id: string;
  readonly escrow_type: string;
  readonly price_type: string;
  readonly fixed_price: string;
  readonly flex_min_price: string;
  readonly flex_max_price: string;
  readonly category: string;
  readonly object: string;
  readonly description: string;
  readonly time_constraints: string;
  readonly transaction_number: string;
  readonly created_at: string;
  readonly updated_at: string;
}
