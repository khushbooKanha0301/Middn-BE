import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  Req
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { SkipThrottle } from "@nestjs/throttler";
import { UserService } from "src/service/user/users.service";
import { EscrowService } from "src/service/escrow/escrows.service";
import { NotFoundException } from "@nestjs/common";
const moment = require("moment");
const numericRegex = /[^0-9.]/g;


@SkipThrottle()
@Controller("escrows")
export class EscrowsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly escrowService: EscrowService
  ) {}

  category: "high_value_items"
  description: "desc"
  escrowType: "seller"
  maxPrice: ""
  minPrice:  ""
  object: "Jewlery"
  price : "10"
  priceType: "fixed"
  processTime: "24 Hours"

  /**
   * This endpoint is used to create a new escrow.
   * @param req 
   * @param response 
   * @returns 
   */
  @SkipThrottle(false)
  @Post("/createEscrow")
  async createEscrow(@Req() req: any, @Res() response) {
    try {
      const reqData = req.body;
      let userDetails = await this.userService.getFindbyAddress(
        req.headers.authData.verifiedAddress
      );
      let errorMessage = null;
      if (!userDetails?.wallet_address) {
        errorMessage = "User not found";
      } else if (!reqData?.escrowType) {
        errorMessage = "Escrow type missing";
      } else if (!reqData?.priceType) {
        errorMessage = "Please select price type fixed or flexible";
      } else if (
        reqData?.priceType &&
        reqData?.priceType == "fixed" &&
        !reqData?.price
      ) {
        errorMessage = "Fixed price is missing";
      } else if (
        reqData?.priceType &&
        reqData?.priceType == "flexible" &&
        (!reqData?.minPrice || !reqData?.maxPrice)
      ) {
        errorMessage = "Flexible minimum price or maximum price is missing";
      } else if (!reqData?.category) {
        errorMessage = "Category is missing";
      } else if (!reqData?.object) {
        errorMessage = "Object is missing";
      } else if (!reqData?.description) {
        errorMessage = "Description is missing";
      } else if (!reqData?.processTime) {
        errorMessage = "Process Time is missing";
      } else if ((reqData?.object != 'Jewlery') || 
      (reqData?.category != 'high_value_items') ||  
      (reqData?.processTime != '24 Hours')
      ) {
        errorMessage = "Something went wrong";
      } else if ((reqData?.priceType != 'fixed') && (reqData?.priceType != 'flexible')){
        errorMessage = "Please add Fixed or Flexible Price.";
      }
      else if ((reqData?.escrowType != 'seller') && (reqData?.escrowType != 'buyer')){
        errorMessage = "Please select Buyer or Seller.";
      } 
      else if ((reqData?.priceType && reqData?.priceType == "fixed" && reqData?.price.match(numericRegex)) || 
      (reqData?.priceType && reqData?.priceType == "flexible" && (reqData?.minPrice.match(numericRegex) || reqData?.maxPrice.match(numericRegex)))  
      ) {
        errorMessage = "Only numeric values accept";
      }
      else if ((reqData?.priceType && reqData?.priceType == "fixed" && reqData?.price <= 0)  
      ) {
        errorMessage = "Please add price greater than 0";
      }
      else if (reqData?.priceType && reqData?.priceType == "flexible" && ((reqData?.minPrice < 5)) 
      ) {
        errorMessage = "Please add Minimum price greater than 5";
      }
      else if (reqData?.priceType && reqData?.priceType == "flexible" && ((reqData?.maxPrice > 100000)) 
      ) {
        errorMessage = "Please add Maxmimum price lesser than 100000 ";
      }
      else if ((reqData?.priceType && reqData?.priceType == "fixed")) {
        if((reqData?.minPrice && (reqData?.minPrice.match(numericRegex) || !reqData?.minPrice.match(numericRegex))) || 
        (reqData?.maxPrice && (reqData?.maxPrice.match(numericRegex) || !reqData?.maxPrice.match(numericRegex)))){
          errorMessage = "Only Fixed Price Accepted";
        } 
      }
      else if ((reqData?.priceType && reqData?.priceType == "flexible")){
        if(reqData?.price && (reqData?.price.match(numericRegex) || !reqData?.price.match(numericRegex))){
          errorMessage = "Only Flexible Minimum and Maxium Price Accepted";
        } 
      }
      if (errorMessage) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json({ status: "failure", message: errorMessage });
      }
      let escrowDto = {
        user_address: userDetails?.wallet_address,
        user_id: userDetails?._id.toString(),
        escrow_type: reqData?.escrowType,
        price_type: reqData?.priceType,
        fixed_price: reqData?.price || null,
        flex_min_price: reqData?.minPrice || null,
        flex_max_price: reqData?.maxPrice || null,
        category: reqData?.category,
        object: reqData?.object,
        description: reqData?.description,
        time_constraints: reqData?.processTime,
        transaction_number: (
          Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000
        ).toString(),
        is_deleted: false,
        trade_status: 0,
        trade_address: null,
        createdAt: moment.utc().format(),
      };
      const escrow = await this.escrowService.createEscrow(escrowDto);
      return response.status(HttpStatus.OK).json({
        message: "Escrow created successfully",
        data: {
         // escrow: escrow,
          escrow_number: escrow?._id,
        },
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  /**
   * This endpoint is used to retrieve escrow details by ID.
   * @param req 
   * @param response 
   * @param id 
   * @returns 
   */
  @Get("/getEscrowsById/:id")
  async getEscrowsById(
    @Req() req: any,
    @Res() response,
    @Param("id") id: string
  ) {
    try {
      let getEscrow = await this.escrowService.getDataById(id);
      let newImage = "";
      if (!getEscrow) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }

      if (getEscrow.profile) {
        const s3 = this.configService.get("s3");
        const bucketName = this.configService.get("aws_s3_bucket_name");
        newImage = await s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: getEscrow.profile ? getEscrow.profile : "",
          Expires: 604800,
        });
      }
      getEscrow.newImage = newImage ? newImage : null;
      getEscrow.fname_alias = getEscrow.fname_alias
        ? getEscrow.fname_alias
        : "John";
      getEscrow.lname_alias = getEscrow.lname_alias
        ? getEscrow.lname_alias
        : "Doe";

      return response.status(HttpStatus.OK).json({
        status: "success",
        data: getEscrow,
      });

    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  /**
   * This endpoint is used to edit escrow details by ID.
   * @param req 
   * @param response 
   * @param id 
   * @returns 
   */
  @SkipThrottle(false)
  @Put("/editEscrow/:id")
  async editEscrow(@Req() req: any, @Res() response, @Param("id") id: string) {
    try {
      const reqData = req.body;

      let userDetails = await this.userService.getFindbyAddress(
        req.headers.authData.verifiedAddress
      );
      let errorMessage = null;
      if (!userDetails?.wallet_address) {
        errorMessage = "User not found";
      } else if (!reqData?.escrowType) {
        errorMessage = "Escrow type missing";
      } else if (!reqData?.priceType) {
        errorMessage = "Please select price type fixed or flexible";
      } else if (
        reqData?.priceType &&
        reqData?.priceType == "fixed" &&
        !reqData?.price
      ) {
        errorMessage = "Fixed price is missing";
      } else if (
        reqData?.priceType &&
        reqData?.priceType == "flexible" &&
        (!reqData?.minPrice || !reqData?.maxPrice)
      ) {
        errorMessage = "Flexible minimum price or maximum price is missing";
      } else if (!reqData?.category) {
        errorMessage = "Category is missing";
      } else if (!reqData?.object) {
        errorMessage = "Object is missing";
      } else if (!reqData?.description) {
        errorMessage = "Description is missing";
      } else if (!reqData?.processTime) {
        errorMessage = "Process Time is missing";
      } else if ((reqData?.object != 'Jewlery') || 
      (reqData?.category != 'high_value_items') ||  
      (reqData?.processTime != '24 Hours')
      ) {
        errorMessage = "Something went wrong";
      } else if ((reqData?.priceType != 'fixed') && (reqData?.priceType != 'flexible')){
        errorMessage = "Please add Fixed or Flexible Price.";
      } else if ((reqData?.escrowType != 'seller') && (reqData?.escrowType != 'buyer')){
        errorMessage = "Please select Buyer or Seller.";
      } else if ((reqData?.priceType && reqData?.priceType == "fixed" && reqData?.price.match(numericRegex)) || 
      (reqData?.priceType && reqData?.priceType == "flexible" && (reqData?.minPrice.match(numericRegex) || reqData?.maxPrice.match(numericRegex)))  
      ) {
        errorMessage = "Only numeric values accept";
      }
      else if ((reqData?.priceType && reqData?.priceType == "fixed" && reqData?.price <= 0)  
      ) {
        errorMessage = "Please add price greater than 0";
      }
      else if (reqData?.priceType && reqData?.priceType == "flexible" && ((reqData?.minPrice < 5)) 
      ) {
        errorMessage = "Please add Minimum price greater than 5";
      }
      else if (reqData?.priceType && reqData?.priceType == "flexible" && ((reqData?.maxPrice > 100000)) 
      ) {
        errorMessage = "Please add Maxmimum price lesser than 100000 ";
      }  
      else if ((reqData?.priceType && reqData?.priceType == "fixed")) {
        if((reqData?.minPrice && (reqData?.minPrice.match(numericRegex) || !reqData?.minPrice.match(numericRegex))) || 
        (reqData?.maxPrice && (reqData?.maxPrice.match(numericRegex) || !reqData?.maxPrice.match(numericRegex)))){
          errorMessage = "Only Fixed Price Accepted";
        } 

      } else if ((reqData?.priceType && reqData?.priceType == "flexible")){
        if(reqData?.price && (reqData?.price.match(numericRegex) || !reqData?.price.match(numericRegex))){
          errorMessage = "Only Flexible Minimum and Maxium Price Accepted";
        } 
      }

      if (errorMessage) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json({ status: "failure", message: errorMessage });
      }
      
      let getEscrow = await this.escrowService.getDataById(id);

      if (!getEscrow) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }
      let escrowDto = {
        escrow_type: reqData?.escrowType,
        price_type: reqData?.priceType,
        fixed_price: reqData?.price || null,
        flex_min_price: reqData?.minPrice || null,
        flex_max_price: reqData?.maxPrice || null,
        category: reqData?.category,
        object: reqData?.object,
        description: reqData?.description,
        time_constraints: reqData?.processTime,
        is_deleted: false,
        createdAt: moment.utc().format(),
      };
      await this.escrowService.updateEscrowData(id, escrowDto);
      let escrow = await this.escrowService.getDataById(id);
      return response.status(HttpStatus.OK).json({
        message: "Escrow has been successfully updated.",
        data: {
          escrow_number: escrow?.transaction_number,
        },
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  /**
   * This endpoint is used to delete escrow details by ID.
   * @param req 
   * @param response 
   * @param id 
   * @returns 
   */
  @SkipThrottle(false)
  @Put("/deleteEscrows/:id")
  async deleteEscrows(
    @Req() req: any,
    @Res() response,
    @Param("id") id: string
  ): Promise<any> {
    try {
      await this.escrowService.updateDeletedById(id);
      return response.status(HttpStatus.OK).json({
        message: "Escrow deleted successfully...",
      });
    } catch (error) {}
  }

  /**
   * HTTP GET method for fetching escrows by user address
   * @param req 
   * @param response 
   * @param address 
   * @returns 
   */
  @SkipThrottle(false) // Disables throttling for this endpoint
  @Get("/getEscrowsByUser/:address")
  async activeEscrows(
    @Req() req: any,
    @Res() response,
    @Param("address") address: string
  ) {
    try {
      const escrows = await this.escrowService.getEscrowsByUser(address);

      if (escrows.length > 0) {
        return response.status(HttpStatus.OK).json({
          status: "Escrow fetched successfully",
          data: escrows,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Escrow not found",
          data: []
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  /**
   * Retrieve all open escrows for the specified user address
   * @param req 
   * @param response 
   * @param address 
   * @returns 
   */
  @Get("/getAllOpenEscrows/:address")
  async getAllOpenEscrows(
    @Req() req: any,
    @Res() response, 
    @Param("address") address: string
    ) {
    try {
      const escrows = await this.escrowService.getAllOpenEscrows(address);
      const escrowsCount = await this.escrowService.getOpenEscrowsCount(address);
 
      if (escrows.length > 0) {
        await Promise.all(
          escrows.map(async (user: any) => {
            let newImage = "";
            if (user.profile) {
              const s3 = this.configService.get("s3");
              const bucketName = this.configService.get("aws_s3_bucket_name");
              newImage = s3.getSignedUrl("getObject", {
                Bucket: bucketName,
                Key: user.profile ? user.profile : "",
                Expires: 600000,
              });

              (user.newImage = newImage ? newImage : null),
                (user.fname_alias = user.fname_alias
                  ? user.fname_alias
                  : "John");
              user.lname_alias = user.lname_alias ? user.lname_alias : "Doe";
            }
          })
        );

        return response.status(HttpStatus.OK).json({
          status: "success",
          data: escrows,
          escrowsCount: escrowsCount,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Escrow not found",
          escrowsCount: 0,
          data: []
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }
}
