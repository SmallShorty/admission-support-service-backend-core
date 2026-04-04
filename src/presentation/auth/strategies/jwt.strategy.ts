import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private accountService: AccountService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secretKey',
    });
  }

  async validate(payload: any) {
    const account = await this.accountService.account({ id: payload.sub });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    const { passwordHash, ...result } = account;
    return result;
  }
}
