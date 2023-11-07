import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateEscrowDto } from "src/dto/create-escrows.dto";
import { IEscrows } from "src/interface/escrows.interface";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EscrowService {
  constructor(
    @InjectModel("escrow") private escrowModel: Model<IEscrows>,
    private configService: ConfigService
  ) {}
  async createEscrow(CreateEscrowDto: CreateEscrowDto): Promise<IEscrows> {
    const newEscrow = await new this.escrowModel(CreateEscrowDto);
    return newEscrow.save();
  }

  async getActiveEscrows(address): Promise<IEscrows[]> {
    return await this.escrowModel.find({
      user_address: address,
    });
  }


  async fetchAllEscrows(
    page?: number,
    pageSize?: number
  ): Promise<any> {
    
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
            $lookup: {
              from: "users",
              localField: "user_address",
              foreignField: "wallet_address",
              as: "user_info"
            }
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
            $project: {
                "user_name": {
                    $concat: ["$user_info.fname_alias", " ", "$user_info.lname_alias"]
                },
                profile: {
                  $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
                },
                "escrow_type":"$escrow_type",
                "price_type":"$price_type",
                "fixed_price":"$fixed_price",
                "flex_min_price":"$flex_min_price",
                "flex_max_price":"$flex_max_price",
                "category": "$category",
                "object":"$object",
                "title":"$title",
                "description":"$description",
                "time_constraints":"$time_constraints",
                "transaction_number":"$transaction_number",
                "createdAt": "$createdAt"
            }
        }
      ]);
      
      if (page && pageSize) {
        // Calculate the number of documents to skip
        const skipCount = (page - 1) * pageSize;
        escrowsQuery = escrowsQuery.skip(skipCount).limit(pageSize);
      }
    
      return await escrowsQuery.exec();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getEscrowCount() {
    const count = await this.escrowModel.countDocuments();
    return count;
  }

}
