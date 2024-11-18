import {
  NestMiddleware,
  Injectable,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { TokenService } from "src/service/token/token.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IUser } from "src/interface/users.interface";
const jwtSecret = "lkjhh";
let jwt = require("jsonwebtoken");

@Injectable()
export class AuthenticateMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    @InjectModel("user") private userModel: Model<IUser>
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      res.header("Access-Control-Allow-Origin", "*"); // Allow all origins or specify your origin
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header(
        "Access-Control-Expose-Headers",
        "Content-Length, 2FA, 2FA_enable , kyc_verify, kyc_status, is_email_verified, is_email"
      );
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      // If no token provided, return UNAUTHORIZED status
      if (token == null) {
        throw new HttpException(
          "Authorization Token not found",
          HttpStatus.UNAUTHORIZED
        );
      }

      const isExistingToken = await this.tokenService.getToken(token);
      if (
        !isExistingToken &&
        req.method !== "POST" &&
        req.originalUrl !== "/login"
      ) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: "Authorization Token not valid." });
      }
      jwt.verify(token, jwtSecret, async (err, authData) => {
        if (err) {
          return res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ message: "Authorization Token not valid." });
        }
        req.headers.address = authData.verifiedAddress;
        const user = await this.userModel
          .findOne({ wallet_address: req.headers.address })
          .exec();

        if (!user && !req.originalUrl.startsWith("/users/verify")) {
          let responseData: { message: string; logout?: any } = {
            message: "Account not found.",
          };
          if (req.originalUrl == "/users/logout") {
            responseData = { ...responseData, logout: true };
          }
          return res.status(HttpStatus.BAD_REQUEST).json(responseData);
        }
        if (user?.is_banned === true) {
          let responseData: { message: string; logout?: any } = {
            message: "You are Blocked by Admin.",
          };
          if (req.originalUrl == "/users/logout") {
            responseData = { ...responseData, logout: true };
          }
          return res.status(HttpStatus.BAD_REQUEST).json(responseData);
        }

        req.headers.authData = authData;
        req.body.authData = authData;
        // Proceed to the next middleware or controller
        if (next) {
          next();
        }
      });
    } catch (error) {
      let errorMessage = "Internal server error";
      if (error.message === "Authorization Token not found") {
        errorMessage = error.message;
      }
      throw new HttpException(errorMessage, error);
    }
  }
}
