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

  async getActiveEscrows( page?: number,
    pageSize?: number,
    address?: string
    ): Promise<any> {
      try {

        let escrowsQuery = this.escrowModel.aggregate([
          {
            $match:{
              user_address: address,
              is_deleted : false
            }
          },
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
                  "profile": {
                    $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
                  },
                  "escrow_type":"$escrow_type",
                  "user_address":"$user_address",
                  "user_id":"$user_id",
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
  async getEscrowActiveCount(address?: string): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.find();
      if(address)
      {
        escrowsQuery = escrowsQuery.where({user_address: address, is_deleted : false});
      }
      const count = await escrowsQuery.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async fetchAllEscrows(
    page?: number,
    pageSize?: number
  ): Promise<any> {
    
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match:{
            is_deleted: false
          }
        },
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
                "user_address":"$user_address",
                "user_id":"$user_id",
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
    try {
      let escrowsQuery = this.escrowModel.find({
        is_deleted: false
      });
      
      const count = await escrowsQuery.countDocuments();
      return count;

    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getDataById(id: string) {
    try {
      const getEscrowById = await this.escrowModel.findById(id);
      return getEscrowById;
    } catch (err) {
      console.log(err);
      return err.message;
    }
  }
  async findByIdAndDelete(id: string) {
    try {
      let escrowsQuery = this.escrowModel.findById({
        id: id
      });

      if (!escrowsQuery) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }

      const existingEscrow = await this.escrowModel.findByIdAndUpdate(
        id,
        {
          is_deleted : true
        }
      );
      if (!existingEscrow) {
        throw new NotFoundException(`Escrow #${id} deleted successfully `);
      }
      return existingEscrow;
      

    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateEscrow(id:string) {
    try {
      const updateDeleted = await this.escrowModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              is_deleted: true,
            },
          },
          { new: true }
        )
        .exec();
        if (!updateDeleted) {
          throw new NotFoundException(`Escrow #${id} not found`);
        }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateEscrowData(id:string, escrowData : any) {
    try {
      const updateDeleted = await this.escrowModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              escrowData,
            },
          },
          { new: true }
        )
        .exec();
        console.log(updateDeleted)
        if (!updateDeleted) {
          throw new NotFoundException(`Escrow #${id} not found`);
        }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateDeletedById(id: string) {
    try {
      const updateDeleted = await this.escrowModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              is_deleted: true,
            },
          },
          { new: true }
        )
        .exec();
        if (!updateDeleted) {
          throw new NotFoundException(`Escrow #${id} not found`);
        }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  

}
