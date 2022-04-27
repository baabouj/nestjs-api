import { ForbiddenException, Injectable } from '@nestjs/common';

import * as argon from 'argon2';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

import { PrismaService } from 'src/prisma/prisma.service';

import { LoginDto, SignupDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new ForbiddenException('Invalid credentials');

    const isValid = await argon.verify(user.password, password);

    if (!isValid) throw new ForbiddenException('Invalid credentials');

    return this.signToken(user.id, user.name);
  }

  async signup({ name, email, password }: SignupDto) {
    try {
      const hashedPassword = await argon.hash(password);

      const user = await this.prismaService.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return this.signToken(user.id, user.name);
    } catch (error) {
      // Check if the error is a unique constraint violation
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ForbiddenException('Credentials already taken');

      throw error;
    }
  }

  async signToken(
    userId: string,
    name: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      name,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '30m',
    });

    return {
      access_token,
    };
  }
}
