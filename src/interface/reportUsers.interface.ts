import { Document } from 'mongoose';
export interface IReportUsers extends Document{
    readonly report_from_user_address: string;
    readonly report_to_user_address: string;
    readonly reason: string;
    readonly created_at: string;
}