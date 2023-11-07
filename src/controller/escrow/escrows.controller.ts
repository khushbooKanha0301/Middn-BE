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
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { SkipThrottle } from "@nestjs/throttler";
import { UserService } from "src/service/user/users.service";
import { EscrowService } from "src/service/escrow/escrows.service";
const moment = require("moment");

@SkipThrottle()
@Controller("escrows")
export class EscrowsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly escrowService: EscrowService
  ) {}

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
        createdAt: moment.utc().format(),
      };
      const escrow = await this.escrowService.createEscrow(escrowDto);
      return response.status(HttpStatus.OK).json({
        message: "Escrow created successfully",
        data: {
          escrow_number: escrow?.transaction_number,
        },
      });
    } catch (err) {
      console.log(err);
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Get("/getAllEscrows")
  async getAllEscrows(@Req() req: any, @Res() response) {
    try {
      const page = req.query.page ? +req.query.page : 1;
      const pageSize = req.query.pageSize ? +req.query.pageSize : 10;
      const escrows = await this.escrowService.fetchAllEscrows(page,
        pageSize,
      );
      const escrowsCount = await this.escrowService.getEscrowCount();

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
              
              user.newImage = newImage ? newImage : null,
              user.fname_alias = user.fname_alias ? user.fname_alias : "John";
              user.lname_alias = user.lname_alias ? user.lname_alias : "Doe";
            }
           })
        );
       
        return response.status(HttpStatus.OK).json({
          status: "success",
          data: escrows,
          escrowsCount: escrowsCount
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Escrow not found",
        });
      }

    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }
}
