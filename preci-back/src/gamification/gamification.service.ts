import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserLevel } from '../users/schemas/user.schema';

const POINTS_MAP: Record<string, number> = {
  price_report: 10,
  confirmation: 5,
  first_report_in_store: 20,
  streak_7_days: 50,
};

const LEVEL_THRESHOLDS: { level: UserLevel; minPoints: number }[] = [
  { level: UserLevel.HEROE, minPoints: 500 },
  { level: UserLevel.EXPERTO, minPoints: 200 },
  { level: UserLevel.COLABORADOR, minPoints: 50 },
  { level: UserLevel.NUEVO, minPoints: 0 },
];

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async addPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { points, totalReports: reason === 'price_report' ? 1 : 0 },
      },
      { new: true },
    );

    if (!user) return null;

    // Recalcular nivel
    const newLevel = this.calculateLevel(user.points);
    if (newLevel !== user.level) {
      user.level = newLevel;
      await user.save();
      this.logger.log(
        `Usuario ${userId} subio a nivel ${newLevel} (${user.points} pts)`,
      );
    }

    return user;
  }

  private calculateLevel(points: number): UserLevel {
    for (const threshold of LEVEL_THRESHOLDS) {
      if (points >= threshold.minPoints) {
        return threshold.level;
      }
    }
    return UserLevel.NUEVO;
  }
}
