import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { RbacGuard } from './rbac.guard';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-later',
      signOptions: { expiresIn: '15m' }, // access token
    }),
  ],
  providers: [AuthService, JwtStrategy, RbacGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
