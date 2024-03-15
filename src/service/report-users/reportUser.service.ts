import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { IReportUsers } from "src/interface/reportUsers.interface";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { CreateReportUserDto } from "src/dto/create-reportUser.dto";

@Injectable()
export class ReportUserService {
  constructor(
    @InjectModel("report_users") private reportUserModel: Model<IReportUsers>,
    private configService: ConfigService
  ) {}
  async createReportUser(
    CreateReportUserDto: CreateReportUserDto
  ): Promise<IReportUsers> {
    const newReport = await new this.reportUserModel(CreateReportUserDto);
    return newReport.save();
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
    const existingReport = await this.reportUserModel.find({
      $or: [
        {
          report_from_user_address: fromReportUser,
          report_to_user_address: toReportUser,
        },
        {
          report_from_user_address: toReportUser,
          report_to_user_address: fromReportUser,
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
}
