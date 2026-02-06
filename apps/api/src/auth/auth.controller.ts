import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChallengeDto } from './dto/challenge.dto';
import { VerifyDto } from './dto/verify.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('challenge')
  challenge(@Body() body: ChallengeDto) {
    return this.auth.createChallenge(body.phone, body.channel);
  }

  @Post('verify')
  async verify(
    @Body() body: VerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.verifyChallenge(body.phone, body.code);

    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      expires: session.expiresAt,
    });

    return { ok: true };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sid = req.cookies?.sid as string | undefined;
    await this.auth.logout(sid);

    res.clearCookie('sid', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const sid = req.cookies?.sid as string | undefined;
    const userId = await this.auth.getUserIdFromSession(sid);
    return { userId };
  }
}
