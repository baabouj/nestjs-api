import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import * as pactum from 'pactum';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { SignupDto } from './../src/auth/dto';

describe('App (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    prisma = app.get(PrismaService);

    // clean th database
    await prisma.$transaction([
      prisma.post.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    await app.init();
    await app.listen(4000);

    pactum.request.setBaseUrl('http://localhost:4000');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: SignupDto = {
      name: 'John Test',
      email: 'john@test.com',
      password: 'secret',
    };

    describe('Signup', () => {
      it('should fail if email is not valid', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, email: 'john@test' })
          .expectStatus(400);
      });

      it('should fail if email is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, email: '' })
          .expectStatus(400);
      });

      it('should fail if name is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, name: '' })
          .expectStatus(400);
      });

      it('should fail if password is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, password: '' })
          .expectStatus(400);
      });

      it('should fail if no body provided', async () => {
        return pactum.spec().post('/auth/signup').expectStatus(400).inspect();
      });

      it('should signup', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .expectBodyContains('access_token')
          .inspect();
      });
    });

    describe('Login', () => {
      it('should fail if email is not valid', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, email: 'john@test' })
          .expectStatus(400);
      });

      it('should fail if email is empty', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, email: '' })
          .expectStatus(400);
      });

      it('should fail if email does not exist', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, email: 'test@john.com' })
          .expectStatus(403)
          .expectBodyContains('Invalid credentials');
      });

      it('should fail if password is empty', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, password: '' })
          .expectStatus(400);
      });

      it('should fail if password is incorrect', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ ...dto, password: 'incorrect' })
          .expectStatus(403)
          .expectBodyContains('Invalid credentials');
      });

      it('should fail if no body provided', async () => {
        return pactum.spec().post('/auth/login').expectStatus(400);
      });

      it('should login', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('access_token')
          .stores('token', 'access_token');
      });
    });

    describe('Protected', () => {
      it('should fail if no token provided', async () => {
        return pactum.spec().post('/auth/protected').expectStatus(401);
      });

      it('should fail if invalid token provided', async () => {
        return pactum
          .spec()
          .post('/auth/protected')
          .withHeaders('Authorization', 'Bearer invalid')
          .expectStatus(401);
      });

      it('should succeed if valid token provided', async () => {
        return pactum
          .spec()
          .post('/auth/protected')
          .withHeaders('Authorization', 'Bearer $S{token}')
          .expectStatus(201)
          .expectBodyContains('John Test')
          .expectBodyContains('john@test.com');
      });
    });
  });
});
