import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLoginHistoryDto } from 'src/dto/create-loginHistory.dto';
import { ILoginHistory } from 'src/interface/loginHisory.interface';

@Injectable()
export class LoginHistoryService {
    constructor(
        @InjectModel("login_history") private loginHistoryModel: Model<ILoginHistory>,
      ) {}
    
    async createLoginHistory(CreateLoginHistoryDto: CreateLoginHistoryDto): Promise<ILoginHistory> {
        const newLoginHistory = await new this.loginHistoryModel(CreateLoginHistoryDto);
        return newLoginHistory.save();
    }

    async getLoginHistory(address?: string)
    {
        const filter = address ? { wallet_address:address } : {};
        return await this.loginHistoryModel.find(filter).exec();
    }
}
