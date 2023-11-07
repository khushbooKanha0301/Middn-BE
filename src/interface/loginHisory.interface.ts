import { Document } from 'mongoose';
export interface ILoginHistory extends Document{
    readonly user_id: string;
    readonly wallet_address: string;
    readonly ip_address: string;
    readonly location: string;
    readonly browser: string;
    readonly login_at: string;
}