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
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { SkipThrottle } from "@nestjs/throttler";
import { UserService } from "src/service/user/users.service";
import { EscrowService } from "src/service/escrow/escrows.service";
import { NotFoundException } from "@nestjs/common";
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
        is_deleted: false,
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
      const escrows = await this.escrowService.fetchAllEscrows(page, pageSize);
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
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Get("/getEscrowsById/:id")
  async getEscrowsById(@Req() req: any, @Res() response, @Param("id") id: string) {
    try {
      
      let getEscrow = await this.escrowService.getDataById(id);
      if (!getEscrow) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }
      let newImage = "";
      if (getEscrow.profile) {
        const s3 = this.configService.get("s3");
        const bucketName = this.configService.get("aws_s3_bucket_name");
        newImage = await s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: getEscrow.profile ? getEscrow.profile : "",
          Expires: 604800,
        });
      }
      getEscrow.newImage = newImage ? newImage : null
      getEscrow.fname_alias = getEscrow.fname_alias ? getEscrow.fname_alias : "John";
      getEscrow.lname_alias = getEscrow.lname_alias ? getEscrow.lname_alias : "Doe";
      return response.status(HttpStatus.OK).json({
        status: "success",
        data: getEscrow
      });

    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @SkipThrottle(false)
  @Put("/editEscrow/:id")
  async editEscrow(@Req() req: any, @Res() response, @Param("id") id: string) {
    try {
      const reqData = req.body;
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

  @SkipThrottle(false)
  @Get("/deleteEscrows/:id")
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

}
