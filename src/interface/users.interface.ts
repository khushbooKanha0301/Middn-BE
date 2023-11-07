import { Document } from 'mongoose';
export interface IUser extends Document{
    readonly fname: string;
    readonly lname: string;
    readonly fname_alias: string;
    readonly lname_alias: string;
    readonly email: string;
	readonly phone: string;
	readonly phoneCountry: string;
	readonly currentpre: string;
	readonly city: string;
	readonly location: string;
    readonly wallet_address: string;
	readonly wallet_type: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly bio: string;
    readonly profile: Express.Multer.File;
    readonly google_auth_secret: string;
    readonly is_2FA_enabled: boolean;
    readonly is_2FA_login_verified: boolean;
    readonly last_login_at: string;
    readonly joined_at: string;
}