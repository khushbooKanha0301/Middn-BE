import { Document } from 'mongoose';
export interface IBlockUsers extends Document{
    readonly block_from_user_address: string;
    readonly block_to_user_address: string;
    readonly userStatus: boolean;
    readonly created_at: string;
}