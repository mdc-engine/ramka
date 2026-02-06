import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomInt, createHash } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashCode(phone: string, code: string) {
    const salt = process.env.OTP_SALT || 'dev-salt';
    return createHash('sha256')
      .update(`${salt}:${phone}:${code}`)
      .digest('hex');
  }

  async createChallenge(phone: string, channel: 'sms') {
    phone = phone.trim();
    if (!phone) throw new BadRequestException('phone is required');

    const now = new Date();

    // блокировка повторной отправки если resendAt ещё не наступил
    const last = await this.prisma.loginChallenge.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (last && last.resendAt > now) {
      throw new HttpException('Try later', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(100000, 1000000)); // 6 digits
    const codeHash = this.hashCode(phone, code);

    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min
    const resendAt = new Date(now.getTime() + 30 * 1000); // 30 sec

    await this.prisma.loginChallenge.create({
      data: {
        phone,
        codeHash,
        channel,
        createdAt: now,
        expiresAt,
        resendAt,
        attemptsLeft: 5,
      },
    });

    // ✅ Заглушка "SMS отправлен": печатаем код в консоль
    console.log(
      `[OTP] phone=${phone} code=${code} expires=${expiresAt.toISOString()}`,
    );

    return { ok: true, resendAt: resendAt.toISOString() };
  }

  async verifyChallenge(phone: string, code: string) {
    phone = phone.trim();
    code = code.trim();
    if (!phone || !code)
      throw new BadRequestException('phone and code are required');

    const now = new Date();

    const ch = await this.prisma.loginChallenge.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!ch) throw new UnauthorizedException('No active challenge');
    if (ch.expiresAt <= now) throw new UnauthorizedException('Code expired');
    if (ch.attemptsLeft <= 0)
      throw new UnauthorizedException('No attempts left');

    const hash = this.hashCode(phone, code);
    if (hash !== ch.codeHash) {
      await this.prisma.loginChallenge.update({
        where: { id: ch.id },
        data: { attemptsLeft: ch.attemptsLeft - 1 },
      });
      throw new UnauthorizedException('Invalid code');
    }

    await this.prisma.loginChallenge.update({
      where: { id: ch.id },
      data: { verifiedAt: now },
    });

    // ✅ phone-only: создаём/получаем пользователя только по phone
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
      select: { id: true },
    });

    // create auth session
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await this.prisma.authSession.create({
      data: { userId: user.id, expiresAt },
    });

    return session;
  }

  async getUserIdFromSession(sessionId: string | undefined) {
    if (!sessionId) return null;

    const s = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, expiresAt: true, revokedAt: true },
    });
    if (!s) return null;
    if (s.revokedAt) return null;
    if (s.expiresAt.getTime() < Date.now()) return null;

    return s.userId;
  }

  async logout(sessionId: string | undefined) {
    if (!sessionId) return;
    await this.prisma.authSession
      .update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }
}
