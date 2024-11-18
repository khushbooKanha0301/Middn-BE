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
import { IUser } from "src/interface/users.interface";
import { Model, ObjectId } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { MailerService } from "@nestjs-modules/mailer";
import { JwtService } from "@nestjs/jwt";
import { EmailService } from "src/service/email/email.service";
const moment = require('moment');

const jwt = require("jsonwebtoken");
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
    private readonly escrowService: EscrowService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectModel("user") private usersModel: Model<IUser>
  ) {}

  /**
   * This endpoint generates a temporary token for a given address ID.
   * @param response 
   * @param param 
   * @returns 
   */
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
  
  /**
   * This endpoint retrieves user details based on the provided address.
   * @param response 
   * @param address 
   * @returns 
   */
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

  /**
   * This endpoint is responsible for retrieving active escrows associated with a specific user address.
   * @param req 
   * @param response 
   * @param address 
   * @returns 
   */
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
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  /**
   * This endpoint is responsible for fetching all escrows based on provided filters.
   * @param req 
   * @param response 
   * @returns 
   */
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

  /**
   * This endpoint is responsible for fetching cryptocurrency details from an external API.
   * @param req 
   * @param response 
   * @returns 
   */
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

  /**
   *  This endpoint is responsible for calculating the equivalent cryptocurrency amount
   * @param req 
   * @param response 
   * @param body 
   * @returns 
   */
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

  /**
   * Endpoint to retrieve all escrows without requiring login.
   * @param req 
   * @param response 
   * @returns 
   */
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

  @SkipThrottle(false)
  @Get("verify-email")
  async verifyEmail(@Req() req, @Res() res) {
    try {
      const token = req.query.token;
      const payload = this.jwtService.verify(token);
     
      const user = await this.usersModel.findOne({
        _id: payload.userId,
        email: payload.email,
      });

      if (!user) {
        return res.status(HttpStatus.OK).json({
          message: "User Not Found",
        });
      }

      if (user?.email_verified) {
        return res.status(HttpStatus.OK).json({
          message: "User Email Already Verified",
        });
      }

      const currentDate = moment.utc().format();
      if (user && !user.email_verified) {
        await this.usersModel
          .updateOne(
            { _id: user._id },
            { email_verified: true, updated_at: currentDate }
          )
          .exec();
      }
      const updateData = await this.usersModel.findById(user._id);
      if (updateData && updateData?.email && updateData.email_verified) {
        const globalContext = {
          formattedDate: moment().format("dddd, MMMM D, YYYY"),
          greeting: `Hello ${
            updateData?.fname
              ? updateData?.fname + " " + updateData?.lname
              : "John Doe"
          }`,
          para1: "Thanks for joining our platform!",
          para2: "As a member of our platform, you can manage your account, purchase token, referrals etc.",
          para3: `Find out more about in - <a href="https://app.middn.com/">https://app.middn.com/</a>`,
          title: "Welcome Email",
        };

        const mailSubject = "Middn.io :: Welcome to https://app.middn.com/";
        const isVerified = await this.emailService.sendVerificationEmail(
          updateData,
          globalContext,
          mailSubject
        );
        if (isVerified) {
          return res.status(HttpStatus.OK).json({
            message: "Email successfully verified!",
          });
        } else {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: "Invalid or expired verification token.",
          });
        }
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: "Failed to update email verification status.",
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const decoded = this.jwtService.decode(req.query.token) as { userId: string; email: string };
       
        const user = await this.usersModel.findOne({
          _id: decoded.userId,
          email: decoded.email,
        });

        if (user && user?.email && (!user?.email_verified ||
          user?.email_verified === undefined)) {
          // Generate a new token
          const newToken = await this.emailService.generateEmailVerificationToken(user.email, user._id);
          const mailUrl = this.configService.get('main_url');
          
          // Resend the verification email with the new token
          const globalContext = {
            formattedDate: moment().format('dddd, MMMM D, YYYY'),
            id: user._id,
            greeting: `Hello ${user?.fname ? user.fname + ' ' + user.lname : 'John Doe'}`,
            heading: 'New Email Verification Link',
            confirmEmail: true,
            para1: "Your previous verification token has expired. Please use the new link below to verify your email.",
            para2: 'Click the button below to confirm your email address and activate your account.',
            url: `${mailUrl}auth/verify-email?token=${newToken}`,
            title: 'Confirm Your Email',
          };

          const mailSubject = 'Middn.io :: New Email Verification Link';
          await this.emailService.sendVerificationEmail(user, globalContext, mailSubject);

          return res.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Expired Verification Token. A new verification email has been sent.',
          });
        } else {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'User not found or already verified.',
          });
        }
      } else {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Invalid Verification Token',
        });
      }
    }
  }
}
