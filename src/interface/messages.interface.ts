import { Document } from 'mongoose';
export interface IMessage extends Document{
    readonly sender_address: string;
    readonly receiver_address: string;
    readonly content: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly file: Express.Multer.File;
}