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

  async checkAlreadyReported(fromReportUser, toReportUser): Promise<Boolean> {
    const existingReport = await this.reportUserModel.findOne({
      report_from_user_address: fromReportUser,
      report_to_user_address: toReportUser,
    });
    if (existingReport) {
      return true;
    } else {
      return false;
    }
  }
}
