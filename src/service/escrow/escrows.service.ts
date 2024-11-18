import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CreateEscrowDto } from "src/dto/create-escrows.dto";
import { IEscrows } from "src/interface/escrows.interface";
import { Types, Model } from "mongoose";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EscrowService {
  constructor(
    @InjectModel("escrow") private escrowModel: Model<IEscrows>,
    private configService: ConfigService
  ) {}

  async createEscrow(CreateEscrowDto: CreateEscrowDto): Promise<IEscrows> {
    try {
      const newEscrow = new this.escrowModel(CreateEscrowDto);
      return await newEscrow.save();
    } catch (error) {
      throw error;
    }
  }

  async getActiveEscrows(
    page?: number,
    pageSize?: number,
    address?: string
  ): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match: {
            user_address: address,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_address",
            foreignField: "wallet_address",
            as: "user_info",
          },
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $project: {
            user_name: {
              $concat: [
                "$user_info.fname_alias",
                " ",
                "$user_info.lname_alias",
              ],
            },
            profile: {
              $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
            },
            escrow_type: "$escrow_type",
            user_address: "$user_address",
            user_id: "$user_id",
            price_type: "$price_type",
            fixed_price: "$fixed_price",
            flex_min_price: "$flex_min_price",
            flex_max_price: "$flex_max_price",
            category: "$category",
            object: "$object",
            title: "$title",
            description: "$description",
            time_constraints: "$time_constraints",
            transaction_number: "$transaction_number",
            createdAt: "$createdAt",
          },
        },
      ]);

      if (page && pageSize) {
        // Calculate the number of documents to skip
        const skipCount = (page - 1) * pageSize;
        escrowsQuery = escrowsQuery.skip(skipCount).limit(pageSize);
      }
      return await escrowsQuery.exec();
    } catch (error) {
      throw error;
    }
  }

  async getEscrowActiveCount(address?: string): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.find();
      if (address) {
        escrowsQuery = escrowsQuery.where({
          user_address: address,
          is_deleted: false,
        });
      }
      const count = await escrowsQuery.countDocuments();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async fetchAllEscrows(page?: number, pageSize?: number, userAddress? :string ,  statusFilter?: any): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match: {
            is_deleted: false,
            $or: [
              { trade_status: 0 },
              { trade_address: userAddress },
              { user_address: userAddress }
            ]
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_address",
            foreignField: "wallet_address",
            as: "user_info",
          },
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $project: {
            user_name: {
              $concat: [
                "$user_info.fname_alias",
                " ",
                "$user_info.lname_alias",
              ],
            },
            profile: {
              $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
            },
            escrow_type: "$escrow_type",
            user_address: "$user_address",
            user_id: "$user_id",
            price_type: "$price_type",
            fixed_price: "$fixed_price",
            flex_min_price: "$flex_min_price",
            flex_max_price: "$flex_max_price",
            category: "$category",
            object: "$object",
            title: "$title",
            description: "$description",
            time_constraints: "$time_constraints",
            transaction_number: "$transaction_number",
            createdAt: "$createdAt",
            trade_status: "$trade_status",
            trade_address: "$trade_address"
            //trade_status: { $ifNull: ["$trade_status", { $literal: undefined }] }
          },
        },
      ]);

      if(statusFilter === 'Sell'){
        escrowsQuery = escrowsQuery.match({
          $and: [
            { escrow_type: 'buyer' },
            { user_address: { $ne: userAddress } }
          ]
        });
        // users.activeCount = await usersQuery.countDocuments();
      } else if (statusFilter === 'Buy'){
        escrowsQuery = escrowsQuery.match({
          $and: [
            { escrow_type: 'seller' },
            { user_address: { $ne: userAddress } }
          ]
        });
      } 

      if (page && pageSize) {
        // Calculate the number of documents to skip
        const skipCount = (page - 1) * pageSize;
        escrowsQuery = escrowsQuery.skip(skipCount).limit(pageSize);
      }

      return await escrowsQuery.exec();
    } catch (error) {
      throw error;
    }
  }

  async getEscrowCount(userAddress? : string, statusFilter?: any) {
    try {
      let escrowsQuery = this.escrowModel.find({
        is_deleted: false,
        // trade_status: 1,
        $or: [
          { trade_status: 0 },
          { trade_address: userAddress },
          { user_address: userAddress }
        ]
      });

      if(statusFilter === 'Sell'){
        escrowsQuery = escrowsQuery.where({
          $and: [
            { escrow_type: 'buyer' },
            { user_address: { $ne: userAddress } }
          ]
        });
        // users.activeCount = await usersQuery.countDocuments();
      } else if (statusFilter === 'Buy'){
        escrowsQuery = escrowsQuery.where({
          $and: [
            { escrow_type: 'seller' },
            { user_address: { $ne: userAddress } }
          ]
        });
      } 
      const count = await escrowsQuery.countDocuments();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async getDataById(id: string) {
    try {
      const ids = new Types.ObjectId(id);
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match: {
            _id: ids,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_address",
            foreignField: "wallet_address",
            as: "user_info",
          },
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $project: {
            user_name: {
              $concat: [
                "$user_info.fname_alias",
                " ",
                "$user_info.lname_alias",
              ],
            },
            profile: {
              $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
            },
            escrow_type: "$escrow_type",
            user_address: "$user_address",
            user_id: "$user_id",
            price_type: "$price_type",
            fixed_price: "$fixed_price",
            flex_min_price: "$flex_min_price",
            flex_max_price: "$flex_max_price",
            category: "$category",
            object: "$object",
            title: "$title",
            description: "$description",
            time_constraints: "$time_constraints",
            transaction_number: "$transaction_number",
            createdAt: "$createdAt",
            trade_status: "$trade_status",
            trade_address: "$trade_address"
          },
        },
        {
          $limit: 1,
        },
      ]);
      const result = await escrowsQuery.exec();
      return result.length > 0 ? result[0] : null;
    } catch (err) {
      return err.message;
    }
  }

  async findByIdAndDelete(id: string) {
    try {
      let escrowsQuery = this.escrowModel.findById(id);

      if (!escrowsQuery) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }

      const existingEscrow = await this.escrowModel.findByIdAndUpdate(id, {
        is_deleted: true,
      });
      if (!existingEscrow) {
        throw new NotFoundException(`Escrow #${id} deleted successfully `);
      }
      return existingEscrow;
    } catch (error) {
      throw error;
    }
  }

  async updateEscrow(id: string) {
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
      throw error;
    }
  }

  async updateEscrowData(id: string, escrowData: any) {
    try {
      const updateEscrowData = await this.escrowModel
        .findByIdAndUpdate(
          id,
          {
            $set: escrowData,
          },
          { new: true }
        )
        .exec();
      if (!updateEscrowData) {
        throw new NotFoundException(`Escrow #${id} not found`);
      }
    } catch (error) {
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
      throw error;
    }
  }

  async getEscrowsByUser(
    address?: string
  ): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.find({
        user_address: address
      });
      return escrowsQuery;
    } catch (error) {
      throw error;
    }
  }

  async getAllEscrows(page?: number, pageSize?: number, statusFilter?: any): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match: {
            is_deleted: false
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_address",
            foreignField: "wallet_address",
            as: "user_info",
          },
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $project: {
            user_name: {
              $concat: [
                "$user_info.fname_alias",
                " ",
                "$user_info.lname_alias",
              ],
            },
            profile: {
              $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
            },
            escrow_type: "$escrow_type",
            user_address: "$user_address",
            user_id: "$user_id",
            price_type: "$price_type",
            fixed_price: "$fixed_price",
            flex_min_price: "$flex_min_price",
            flex_max_price: "$flex_max_price",
            category: "$category",
            object: "$object",
            title: "$title",
            description: "$description",
            time_constraints: "$time_constraints",
            transaction_number: "$transaction_number",
            createdAt: "$createdAt",
            trade_status: "$trade_status",
            trade_address: "$trade_address"
          },
        },
      ]);

      if(statusFilter === 'Sell'){
        escrowsQuery = escrowsQuery.match({
          escrow_type: 'buyer' 
        });
      } else if (statusFilter === 'Buy'){
        escrowsQuery = escrowsQuery.match({
          escrow_type: 'seller' 
        });
      } 

      if (page && pageSize) {
        // Calculate the number of documents to skip
        const skipCount = (page - 1) * pageSize;
        escrowsQuery = escrowsQuery.skip(skipCount).limit(pageSize);
      }

      return await escrowsQuery.exec();
    } catch (error) {
      throw error;
    }
  }

  async getEscrowsCount(statusFilter?: any) {
    try {
      let escrowsQuery = this.escrowModel.find({
        is_deleted: false
      });

      if(statusFilter === 'Sell'){
        escrowsQuery = escrowsQuery.where({
          escrow_type: 'buyer' 
        });
        // users.activeCount = await usersQuery.countDocuments();
      } else if (statusFilter === 'Buy'){
        escrowsQuery = escrowsQuery.where({
          escrow_type: 'seller'
        });
      } 
      const count = await escrowsQuery.countDocuments();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async getAllOpenEscrows(userAddress?: any): Promise<any> {
    try {
      let escrowsQuery = this.escrowModel.aggregate([
        {
          $match: {
            is_deleted: false,
            trade_status: 1,
            $or: [
              { trade_address: userAddress },
              { user_address: userAddress }
            ]
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "trade_address",
            foreignField: "wallet_address",
            as: "user_info",
          },
        },
        {
          $unwind: {
            path: "$user_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_address",
            foreignField: "wallet_address",
            as: "users_info",
          },
        },
        {
          $unwind: {
            path: "$users_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $lookup: {
            from: "trades", // Replace with your actual table name
            localField: "trade_address",
            foreignField: "wallet_address", // Replace with the field in another table that matches user_address
            as: "trade_info",
          },
        },
        {
          $unwind: {
            path: "$trade_info",
            preserveNullAndEmptyArrays: true, // Make the join optional
          },
        },
        {
          $project: {
            user_trade_name: {
              $concat: [
                "$user_info.fname_alias",
                " ",
                "$user_info.lname_alias",
              ],
            },
            user_escrow_name: {
              $concat: [
                "$users_info.fname_alias",
                " ",
                "$users_info.lname_alias",
              ],
            },
            profile: {
              $ifNull: ["$user_info.profile", null], // Return null if 'profile' is null
            },
            escrow_type: "$escrow_type",
            user_address: "$user_address",
            user_id: "$user_id",
            price_type: "$price_type",
            fixed_price: "$fixed_price",
            flex_min_price: "$flex_min_price",
            flex_max_price: "$flex_max_price",
            category: "$category",
            object: "$object",
            title: "$title",
            description: "$description",
            time_constraints: "$time_constraints",
            transaction_number: "$transaction_number",
            createdAt: "$createdAt",
            trade_status: "$trade_status",
            amount: "$trade_info.amount",
            trade_address: "$trade_address"
          },
        },
        {
          $group: {
            _id: "$_id", // Group by the unique identifier of the escrow document
            user_trade_name: { $first: "$user_trade_name" },
            user_escrow_name: { $first: "$user_escrow_name" },
            profile: { $first: "$profile" },
            escrow_type: { $first: "$escrow_type" },
            user_address: { $first: "$user_address" },
            user_id: { $first: "$user_id" },
            price_type: { $first: "$price_type" },
            fixed_price: { $first: "$fixed_price" },
            flex_min_price: { $first: "$flex_min_price" },
            flex_max_price: { $first: "$flex_max_price" },
            category: { $first: "$category" },
            object: { $first: "$object" },
            title: { $first: "$title" },
            description: { $first: "$description" },
            time_constraints: { $first: "$time_constraints" },
            transaction_number: { $first: "$transaction_number" },
            createdAt: { $first: "$createdAt" },
            trade_status: { $first: "$trade_status" },
            amount: { $first: "$amount" },
            trade_address: { $first: "$trade_address" }
          },
        },
        {
          $sort: {
            createdAt: -1 // Sort by createdAt field in ascending order
          }
        }
      ]);

      return await escrowsQuery.exec();
    } catch (error) {
      throw error;
    }
  }

  async getOpenEscrowsCount(userAddress?: any) {
    try {
      let escrowsQuery = this.escrowModel.find({
        is_deleted: false,
        trade_status: 1,
        $or: [
          { trade_address: userAddress },
          { user_address: userAddress }
        ]
      });

      const count = await escrowsQuery.countDocuments();
      return count;
    } catch (error) {
      throw error;
    }
  }
}
