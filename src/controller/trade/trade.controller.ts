import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { TradeService } from "src/service/trade/trade.service";
import { CreateTradeDto } from "src/dto/create-trade.dto";
import axios from "axios";

@SkipThrottle()
@Controller("trade")
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post("/createTrade")
  async createTrade(@Res() response, @Body() createTradeDto: CreateTradeDto) {
    try {
      const newTrade = await this.tradeService.createTrade(createTradeDto);
      let responseData = await axios.get(
        `https://api.coingate.com/v2/rates/merchant/${createTradeDto.crypto_currency}/${createTradeDto.country_currency}`
      );
      let amountUSD = Number(createTradeDto.amount) * responseData.data;
      let cryptoAmount = amountUSD * 0.49;
      if(cryptoAmount != createTradeDto?.conversation_amount)
      {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Something Went Wrong.",
        });
      }

      return response.status(HttpStatus.CREATED).json({
        message: "Trade has been created successfully",
        newTrade,
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: "Error: Trade not created!",
        error: "Bad Request",
      });
    }
  }
}
