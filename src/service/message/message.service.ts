import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessage } from 'src/interface/messages.interface';
import { CreateMessageDto } from 'src/dto/create-messages.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MessageService {
    constructor(
		@InjectModel('message') private messageModel: Model<IMessage>,
		private configService: ConfigService
	) {  }
	async createMessage(CreateUserDto: CreateMessageDto, file: Express.Multer.File = null): Promise<IMessage> {
		let key = null;
		if(!!file){
			const s3 = this.configService.get('s3');
			const bucketName = this.configService.get('aws_s3_bucket_name');
			key = new Date().valueOf() + "_" + file.originalname;

			const params = {
				Bucket: bucketName,
				Key: key,
				//Body: file.buffer,
			};

			await new Promise(async (resolve,reject) => {
				await s3.upload(params, async function (err, data) {
					if (!err) {
						return resolve(true);
					} else {
						return reject(false)
					}
				});
			});
		}

		const newMessage = await new this.messageModel(file? {...CreateUserDto,
			file: key} : {...CreateUserDto});

		return newMessage.save();
	}

	async getMessage(sender_address:string , receiver_address:string): Promise<any> {
		await this.messageModel.updateMany({ receiver_address: sender_address, sender_address: receiver_address },
			{ $set: { is_readed: true } });
		const user = await this.messageModel
			.find({
				$or: [
					{ sender_address: sender_address, receiver_address: receiver_address },
					{ sender_address: receiver_address, receiver_address: sender_address }
				]
			}).select('-_id -updated_at -__v');
			
		return user;
	}
}
