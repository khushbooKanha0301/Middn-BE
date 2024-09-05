import { Module, MiddlewareConsumer } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersController } from "./controller/user/users.controller";
import { AuthController } from "./controller/auth/auth.controller";
import { TradeController } from "./controller/trade/trade.controller";
import { UserSchema } from "./schema/user.schema";
import { UserService } from "./service/user/users.service";
import { AuthenticateMiddleware } from "./middleware/authenticate.middleware";
import { ConfigModule , ConfigService} from "@nestjs/config";
import { MessagesController } from "./controller/message/messages.controller";
import { MessageService } from "./service/message/message.service";
import configuration from "./config/configuration";
import { MessageSchema } from "./schema/message.schema";
import { TokenService } from "./service/token/token.service";
import { TradeService } from "./service/trade/trade.service";
import { TokenSchema } from "./schema/token.schema";
import { TradeSchema } from "./schema/trade.schema";
import { LoginHistorySchema } from "./schema/loginHistory.schema";
import { EscrowSchema } from "./schema/escrow.schema";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { CustomThrottleMiddleware } from "./middleware/custom-throttle.middleware";
import { LoginHistoryService } from "./service/login-history/login-history.service";
import { EscrowsController } from "./controller/escrow/escrows.controller";
import { EscrowService } from "./service/escrow/escrows.service";
import { ReportUsersSchema } from "./schema/reportUsers.schema";
import { BlockUsersSchema } from "./schema/blockUser.schema";
import { ReportUserService } from "./service/report-users/reportUser.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { join } from "path";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from "./service/email/email.service";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://127.0.0.1:27017/middn"),
    MongooseModule.forFeature([{ name: "user", schema: UserSchema }]),
    MongooseModule.forFeature([{ name: "message", schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: "token", schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: "trade", schema: TradeSchema }]),
    MongooseModule.forFeature([
      { name: "login_history", schema: LoginHistorySchema },
    ]),
    MongooseModule.forFeature([{ name: "escrow", schema: EscrowSchema }]),
    MongooseModule.forFeature([
      { name: "report_users", schema: ReportUsersSchema },
    ]),
    MongooseModule.forFeature([
      { name: "block_users", schema: BlockUsersSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('NEST_JWT_EMAIL_SECRET'),
        signOptions: { expiresIn: '120s' },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.NEST_MAIL_HOST,
        port: process.env.NEST_MAIL_PORT,
        //secure: false,
        auth: {
          user: process.env.NEST_MAIL_USER,
          pass: process.env.NEST_MAIL_PASSWORD,
        },
      },
      template: {
        dir: join(__dirname, "mails"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
      defaults: {
        from: process.env.NEST_MAIL_FROM_MAIL,
      },
    }),
    ThrottlerModule.forRoot({
      ttl: 5,
      limit: 5,
    }),
  ],
  controllers: [
    AppController,
    UsersController,
    AuthController,
    MessagesController,
    EscrowsController,
    TradeController
  ],
  providers: [
    AppService,
    UserService,
    TokenService,
    MessageService,
    EscrowService,
    LoginHistoryService,
    ReportUserService,
    EmailService,
    TradeService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthenticateMiddleware)
      .forRoutes("/users", "/message", "/escrows");
    consumer
      .apply(CustomThrottleMiddleware)
      .forRoutes(
        "/users",
        "/users/updateAccountSettings",
        "/users/generate2FASecret",
        "/users/validateTOTP",
        "/users/disable2FA",
        "/users/verify",
        "/escrows/createEscrow"
      );
  }
}
