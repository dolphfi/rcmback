import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { UsersService } from '../../users/users.service';
import { FastifyRequest } from 'fastify';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true, // Passer la requête au callback validate
    });
  }

  async validate(req: FastifyRequest, payload: any) {
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Vérifier si l'URL de la requête contient '/unlock'
    const isUnlockEndpoint = req && req.url && req.url.includes('/unlock');

    // Si c'est un super admin qui essaie de débloquer un compte, on ne vérifie pas son statut de verrouillage
    const isAdmin = user.role?.name === 'SUPER_ADMIN';

    if (user.isLockedOut().isLocked && !(isAdmin && isUnlockEndpoint)) {
      throw new UnauthorizedException(user.isLockedOut().message);
    }

    return user;
  }
}
