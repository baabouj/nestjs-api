import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User as UserModel } from '@prisma/client';

import { AuthService } from './auth.service';
import { JwtGuard } from './jwt';
import { LoginDto, SignupDto } from './dto';
import { User } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(JwtGuard)
  @Post('protected')
  protected(@User() user: UserModel) {
    return user;
  }
}
