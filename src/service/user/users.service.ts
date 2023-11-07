import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateUserDto } from "src/dto/create-users.dto";
import { IUser } from "src/interface/users.interface";
import { Model } from "mongoose";
import { UpdateUserProfileDto } from "src/dto/update-users-profile.dto";
import { ConfigService } from "@nestjs/config";
import { UpdateAccountSettingsDto } from "src/dto/update-account-settings.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user") private userModel: Model<IUser>,
    private configService: ConfigService
  ) {}
  async createUser(CreateUserDto: CreateUserDto): Promise<IUser> {
    const newUser = await new this.userModel(CreateUserDto);
    return newUser.save();
  }
  async updateUser(
    userId: string,
    body: UpdateUserProfileDto,
    file: Express.Multer.File = null,
    bucketName: string = null
  ): Promise<IUser> {
    let key = null;
    if (!!file) {
      const s3 = this.configService.get("s3");
      const bucketName = this.configService.get("aws_s3_bucket_name");
      key = new Date().valueOf() + "_" + file.originalname;

      const params = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
      };

      await new Promise(async (resolve, reject) => {
        await s3.upload(params, async function (err, data) {
          if (!err) {
            return resolve(true);
          } else {
            return reject(false);
          }
        });
      });
    }
    if(body.is_profile_deleted)
    {
      body.profile = null;
      delete body.is_profile_deleted;
    }
    const existingUser = await this.userModel.findByIdAndUpdate(
      userId,
      file ? { ...body, profile: key } : { ...body },
      { new: true }
    );
    if (!existingUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return existingUser;
  }

  async updateAccountSettings(
    userId: string,
    body: UpdateAccountSettingsDto
  ): Promise<IUser> {
    const existingUser = await this.userModel.findByIdAndUpdate(userId, {
      ...body,
    });
    if (!existingUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return existingUser;
  }

  async getUser(userId: string): Promise<any> {
    const existingUser = await this.userModel
      .findById(userId)
      .select("-_id -__v -nonce -google_auth_secret")
      .exec();
    if (!existingUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return existingUser;
  }
  async getFindbyAddress(address: string): Promise<any> {
    const existingUser = await this.userModel
      .findOne({ wallet_address: address })
      .exec();
    return existingUser;
  }
  async deleteUser(userId: string): Promise<IUser> {
    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return deletedUser;
  }
  async getAllUsersExceptAuth(userId: string): Promise<any> {
    const allUsers = await this.userModel.find();
    const existingUser = allUsers.filter((user) => user.id !== userId);
    return existingUser;
  }
  async getUserDetailByAddress(address: string): Promise<any> {
    const existingUser = await this.userModel
      .findOne({ wallet_address: address })
      .exec();
    if (!existingUser) {
      throw new NotFoundException(`Address #${address} not found`);
    }
    return existingUser;
  }
  async getOnlyUserBioByAddress(address: string): Promise<any> {
    const existingUser = await this.userModel
      .findOne({ wallet_address: address })
      .select("wallet_address bio fname_alias lname_alias profile fname lname location -_id")
      .exec();
    if (!existingUser) {
      throw new NotFoundException(`Address #${address} not found`);
    }
    return existingUser;
  }
}
