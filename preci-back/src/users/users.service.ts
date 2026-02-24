import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash });
  }

  async setEmailOtp(
    userId: string,
    otp: string,
    expiry: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      emailOtp: otp,
      emailOtpExpiry: expiry,
      emailOtpAttempts: 0,
    });
  }

  async getEmailOtp(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(userId)
      .select('+emailOtp +emailOtpExpiry +emailOtpAttempts');
  }

  async clearEmailOtp(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { emailOtp: '', emailOtpExpiry: '' },
      emailOtpAttempts: 0,
    });
  }

  async incrementOtpAttempts(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { emailOtpAttempts: 1 },
    });
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId });
  }

  async createFromGoogle(data: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    picture?: string;
  }): Promise<UserDocument> {
    return this.userModel.create({
      email: data.email,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
      googleId: data.googleId,
      avatarUrl: data.picture,
      authProvider: 'google',
      isActive: true,
    });
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { googleId });
  }
}
