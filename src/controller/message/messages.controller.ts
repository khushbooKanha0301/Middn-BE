import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  Req,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { MessageService } from "../../service/message/message.service";
import { CreateMessageDto } from "src/dto/create-messages.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserService } from "src/service/user/users.service";
import { ConfigService } from "@nestjs/config";
import { IMessage } from "src/interface/messages.interface";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { SkipThrottle } from "@nestjs/throttler";
@Controller("message")
export class MessagesController {
  constructor(
    @InjectModel("message") private messageModel: Model<IMessage>,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async createMessage(
    @Req() req: any,
    @Res() response,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const receiver = await this.userService.getFindbyAddress(
        createMessageDto.receiver_address
      );
      if (!receiver) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Invalid receiver",
        });
      }
      if (
        req.headers.authData.verifiedAddress !=
        createMessageDto.receiver_address
      ) {
        createMessageDto.sender_address = req.headers.authData.verifiedAddress;

        if (createMessageDto.content !== "" || file !== undefined) {
          // Array of allowed files
          const array_of_allowed_files = [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "bmp",
            "tiff",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "odt",
            "rtf",
            "mp3",
            "wav",
            "aiff",
            "aac",
            "mp4",
            "avi",
            "mov",
            "wmv",
          ];

          // Allowed file size in mb
          const allowed_file_size = 5;

          // Get the extension of the uploaded file
          if (file) {
            const file_extension = file.originalname.slice(
              ((file.originalname.lastIndexOf(".") - 1) >>> 0) + 2
            );
            // Check if the uploaded file is allowed
            if (!array_of_allowed_files.includes(file_extension)) {
              return response
                .status(HttpStatus.BAD_REQUEST)
                .json({ message: "Inappropriate file type" });
            }

            if (
              file.size / (1024 * 1024) > allowed_file_size ||
              file.size < 1
            ) {
              return response
                .status(HttpStatus.BAD_REQUEST)
                .json({
                  message: "File size should come between 1 Byte to 2 MB",
                });
            }
          }

          const newUser = await this.messageService.createMessage(
            createMessageDto,
            file
          );
          return response.status(HttpStatus.CREATED).json({
            message: "Message has been Send successfully",
          });
        }
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Empty/Inappropriate message content",
        });
      }
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: "Sender and Receiver should not be same",
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: "Error: Message not created!",
        error: "Bad Request",
      });
    }
  }

  @Get(":receiver_address")
  async getMessage(
    @Req() req: any,
    @Res() response,
    @Param("receiver_address") receiver_address: string
  ) {
    try {
      const Allmessage = await this.messageService.getMessage(
        req.headers.authData.verifiedAddress,
        receiver_address
      );
      let messages = [];
      Allmessage.map((msg: any) => {
        let fileUrl = "";
        if (msg.file) {
          const s3 = this.configService.get("s3");
          const bucketName = this.configService.get("aws_s3_bucket_name");
          fileUrl = s3.getSignedUrl("getObject", {
            Bucket: bucketName,
            Key: msg.file ? msg.file : "",
            Expires: 604800,
          });
        }
        messages.push({ messages: msg, fileUrl: fileUrl });
      });

      return response.status(HttpStatus.CREATED).json({
        message: "Message found successfully",
        messages,
      });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: "Error: Message not found!",
        error: "Bad Request",
      });
    }
  }
}
