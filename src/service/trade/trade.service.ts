import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateTradeDto } from "src/dto/create-trade.dto";
import { ITrade } from "src/interface/trade.interface";
import { Model } from "mongoose";

@Injectable()
export class TradeService {
  constructor(
    @InjectModel("trade") private tradeModel: Model<ITrade>
  ) {}

  createTrade(CreateTradeDto: CreateTradeDto): Promise<ITrade> {
    try {
      const newTrade = new this.tradeModel(CreateTradeDto);
      return newTrade.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
