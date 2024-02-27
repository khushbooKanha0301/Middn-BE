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
} from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { EscrowService } from "src/service/escrow/escrows.service";
import { UserService } from "src/service/user/users.service";
import { SkipThrottle } from "@nestjs/throttler";
var jwt = require("jsonwebtoken");
const getSignMessage = (address, nonce) => {
  return `Please sign this message for address ${address}:\n\n${nonce}`;
};
const Web3 = require("web3");
const jwtSecret = "lkjhh";
const web3 = new Web3("https://cloudflare-eth.com/");

@SkipThrottle()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly escrowService: EscrowService
  ) {}

  @Get("/nonce/:addressId")
  async generateToken(@Res() response, @Param() param: { addressId: string }) {
    try {
      const nonce = new Date().getTime();
      const address = param.addressId;
      const tempToken = jwt.sign({ nonce, address }, jwtSecret, {
        expiresIn: "120s",
      });
      const message = getSignMessage(address, nonce);
      return response.json({ tempToken, message });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Get("/getuser/:address")
  async getUserDetailByAddress(
    @Res() response,
    @Param("address") address: string 
  ) {
    try {
      let user = await this.userService.getOnlyUserBioByAddress(address);

      let docUrl = "";
      if (user.profile) {
        const s3 = this.configService.get("s3");
        const bucketName = this.configService.get("aws_s3_bucket_name");
        docUrl = await s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: user.profile ? user.profile : "",
          Expires: 604800,
        });
      }

      user.fname_alias = user.fname_alias ? user.fname_alias : "John";
      user.lname_alias = user.lname_alias ? user.lname_alias : "Doe";
      return response.json({ docUrl: docUrl, user: user });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Get("/activeEscrows/:address")
  async activeEscrows(
    @Req() req: any,
    @Res() response,
    @Param("address") address: string
  ) {
    try {
      const page = req.query.page ? +req.query.page : 1;
      const pageSize = req.query.pageSize ? +req.query.pageSize : 10;
      const escrows = await this.escrowService.getActiveEscrows(
        page,
        pageSize,
        address
      );

      const escrowsCount = await this.escrowService.getEscrowActiveCount(
        address
      );

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
          status: "Escrow fetched successfully",
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
      console.log(err);
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Get("/getAllEscrows")
  async getAllEscrows(@Req() req: any, @Res() response) {
    try {
      const page = req.query.page ? +req.query.page : 1;
      const pageSize = req.query.pageSize ? +req.query.pageSize : 10;
      const statusFilter = req.query.statusFilter ? req.query.statusFilter : null;
      const userData = req.query.userAddress;
      const escrows = await this.escrowService.fetchAllEscrows(page, pageSize, userData, statusFilter);
      const escrowsCount = await this.escrowService.getEscrowCount(userData, statusFilter);
 
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

  @Get("/getCryptoDetails")
  async getCryptoDetails(
    @Req() req: any,
    @Res() response,
    // @Body() body: { usdAmount: any; cryptoSymbol: any }
  ) {
    try {
      let responseData = await axios.get(
        `https://api.coingate.com/api/v2/currencies?kind=crypto`
      );
      if (responseData) {
        return response.json({ 
          message: `Crypto get successfully`,
          data: responseData.data 
        });
       
      } else {
        return response.json({ 
          message: "Something went wrong",
        });
      }
    } catch (err) {
      return response.status(err.status).json(err.response);
    }
  }

  @Post("/getCryptoAmountDetails")
  async getCryptoAmountDetails(
    @Req() req: any,
    @Res() response,
    @Body() body: { usdAmount: any; cryptoSymbol: any , cryptoCountry: any}
  ) {
    try {
      if (!req.body.cryptoSymbol) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Please select crypto currency",
        });
      } else {
        let cryptoAmount = null;
        if (req.body.cryptoSymbol == "USD") {
          cryptoAmount = body.usdAmount * 0.49;
        } else {
          let responseData = await axios.get(
            `https://api.coingate.com/v2/rates/merchant/${req.body.cryptoSymbol}/${req.body.cryptoCountry}`
          );
          let amountUSD = body.usdAmount * responseData.data;
          cryptoAmount = amountUSD * 0.49;
        }
        if (cryptoAmount) {
          return response.status(HttpStatus.OK).json({
            message: `${req.body.cryptoSymbol}: ${req.body.usdAmount} => MID: ${cryptoAmount}`,
            amount: cryptoAmount,
          });
        } else {
          return response.status(HttpStatus.OK).json({
            message: "Something went wrong",
          });
        }
      }
    } catch (err) {
      return response.status(err.status).json(err.response);
    }
  }

  @Get("/getAllEscrowsWithoutLogin")
  async getAllEscrowsWithoutLogin(@Req() req: any, @Res() response) {
    try {
      const page = req.query.page ? +req.query.page : 1;
      const pageSize = req.query.pageSize ? +req.query.pageSize : 10;
      const statusFilter = req.query.statusFilter ? req.query.statusFilter : null;
      const escrows = await this.escrowService.getAllEscrows(page, pageSize,  statusFilter);
      const escrowsCount = await this.escrowService.getEscrowsCount(statusFilter);
 
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
