import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  login() {
    // TODO: Implement login
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

      // TODO: return a JWT, holding the user id, instead of the user object

      delete user.password;
      return user;
    } catch (error) {
      // Check if the error is a unique constraint violation
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials already taken');
        }
      }
      throw error;
    }
  }
}
