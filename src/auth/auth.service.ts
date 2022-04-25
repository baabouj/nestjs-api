import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  login() {
    // TODO: Implement login
  }

  signup() {
    // TODO: Implement signup
  }
}
