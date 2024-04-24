import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { IReportUsers } from "src/interface/reportUsers.interface";
import { IBlockUsers } from "src/interface/blockUsers.interface";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { CreateReportUserDto } from "src/dto/create-reportUser.dto";
import { CreateBlockUserDto } from "src/dto/create-blockUser.dto";

@Injectable()
export class ReportUserService {
  constructor(
    @InjectModel("report_users") private reportUserModel: Model<IReportUsers>,
    @InjectModel("block_users") private blockUserModel: Model<IBlockUsers>,
    private configService: ConfigService
  ) {}

  async createBlockUser(
    CreateBlockUserDto: CreateBlockUserDto
  ): Promise<IBlockUsers> {
    const newReport = await new this.blockUserModel(CreateBlockUserDto);
    return newReport.save();
  }

  async createReportUser(
    CreateReportUserDto: CreateReportUserDto
  ): Promise<IReportUsers> {
    const newReport = await new this.reportUserModel(CreateReportUserDto);
    return newReport.save();
  }

  async checkAlreadyBlock(fromReportUser, toReportUser): Promise<any> {
    const existingReport = await this.blockUserModel.findOne({
      block_from_user_address: fromReportUser,
      block_to_user_address: toReportUser,
    });
   return existingReport;
  }

  async checkAlreadyReported(fromReportUser, toReportUser): Promise<any> {
    const existingReport = await this.reportUserModel.findOne({
      report_from_user_address: fromReportUser,
      report_to_user_address: toReportUser,
    });
   return existingReport;
  }

  async fetchReportedData(fromReportUser, toReportUser): Promise<any> {
    const existingReport = await this.reportUserModel.findOne({
      report_from_user_address: fromReportUser,
      report_to_user_address: toReportUser,
    });
    if (existingReport) {
      return existingReport;
    } else {
      return {
        report_from_user_address: fromReportUser,
        report_to_user_address: toReportUser,
        userStatus : false
      };
    }
  }

  async fetchReportedDataStatus(fromReportUser, toReportUser): Promise<any> {
    const existingReport = await this.blockUserModel.find({
      $or: [
        {
          block_from_user_address: fromReportUser,
          block_to_user_address: toReportUser,
        },
        {
          block_from_user_address: toReportUser,
          block_to_user_address: fromReportUser,
        },
      ],
    });
    const reportWithTrueUserStatus = existingReport.find(report => report.userStatus === true);

    if (reportWithTrueUserStatus) {
      return {
        userStatus : reportWithTrueUserStatus.userStatus
      };
    } else {
      return {
        userStatus : false
     };
    }
  }

  async updateReportUser(
    userId,
    updateReportUser
  ): Promise<any> {
    const existingUser = await this.reportUserModel.findByIdAndUpdate(
      userId,
      updateReportUser,
      { new: true }
    );
    if (!existingUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return existingUser;
  }

  async updateBlockUser(
    userId,
    updateBlockUser
  ): Promise<any> {
    const existingUser = await this.blockUserModel.findByIdAndUpdate(
      userId,
      updateBlockUser,
      { new: true }
    );
    if (!existingUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return existingUser;
  }
}
