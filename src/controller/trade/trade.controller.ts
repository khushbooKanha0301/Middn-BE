import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { TradeService } from "src/service/trade/trade.service";
import { CreateTradeDto } from "src/dto/create-trade.dto";
import { EscrowService } from "src/service/escrow/escrows.service";
const moment = require("moment");

@SkipThrottle()
@Controller("trade")
export class TradeController {
  constructor(private readonly tradeService: TradeService,
    private readonly escrowService: EscrowService) {}

  /**
   * This endpoint creates a new trade associated with an escrow.
   * @param response 
   * @param createTradeDto 
   * @returns 
   */
  @SkipThrottle(false)
  @Post("/createTrade")
  async createTrade(@Res() response, @Body() createTradeDto: CreateTradeDto) {
    try {
      const tradeExist = await this.tradeService.getTrade(createTradeDto.escrow_id)
      if(tradeExist){
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Trade is closed!",
        });
      }
      createTradeDto.createdAt=  moment.utc().format()
      const newTrade = await this.tradeService.createTrade(createTradeDto);
      const escrowDto = {trade_status : 1, trade_address: createTradeDto.trade_address}
      if(newTrade){
        await this.escrowService.updateEscrowData(createTradeDto.escrow_id, escrowDto);
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

  /**
   * This endpoint retrieves the trade associated with the specified escrow.
   * @param req 
   * @param response 
   * @param escrowId 
   * @returns 
   */
  @SkipThrottle(false)
  @Get("/getTradeByEscrow/:escrowId")
  async getTradeByEscrow(
    @Req() req: any,
    @Res() response,
    @Param("escrowId") escrowId: string
  ) {
    try {
      const tradeExist = await this.tradeService.getTrade(escrowId);
     
      if (tradeExist) {
        return response.status(HttpStatus.OK).json({
          status: "Trade fetched successfully",
          data: tradeExist,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Trade not found",
          data: null
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }
}
