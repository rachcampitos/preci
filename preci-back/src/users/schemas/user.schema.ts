import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum AuthProvider {
  PHONE = 'phone',
  GOOGLE = 'google',
  ANONYMOUS = 'anonymous',
}

export enum UserLevel {
  NUEVO = 'nuevo',
  COLABORADOR = 'colaborador',
  EXPERTO = 'experto',
  HEROE = 'heroe',
}

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: Record<string, any>) => {
      delete ret.passwordHash;
      delete ret.phoneVerificationCode;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ unique: true, sparse: true, index: true })
  phone: string;

  @Prop({ unique: true, sparse: true, index: true })
  email: string;

  @Prop()
  googleId: string;

  @Prop()
  displayName: string;

  @Prop()
  avatarUrl: string;

  @Prop({ select: false })
  passwordHash: string;

  @Prop({ select: false })
  phoneVerificationCode: string;

  @Prop()
  phoneVerificationExpiry: Date;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.ANONYMOUS })
  authProvider: AuthProvider;

  @Prop({ default: 0 })
  points: number;

  @Prop({ type: String, enum: UserLevel, default: UserLevel.NUEVO })
  level: UserLevel;

  @Prop({ default: 0 })
  totalReports: number;

  @Prop({ default: 0 })
  totalConfirmations: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshTokenHash: string;

  @Prop({ default: 0 })
  tokenVersion: number;

  @Prop([String])
  fcmTokens: string[];

  @Prop({ type: Object, default: {} })
  preferences: {
    notificationsEnabled: boolean;
    defaultDistrict: string;
    distanceRadius: number;
  };
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ points: -1 });
