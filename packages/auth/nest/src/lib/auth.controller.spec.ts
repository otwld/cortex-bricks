import type { Mock } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe(AuthController.name, () => {
  let app: INestApplication;
  let authService: {
    register: Mock;
    devLogin: Mock;
    forgotPassword: Mock;
    resetPassword: Mock;
  };

  beforeEach(async () => {
    authService = {
      register: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      devLogin: vi.fn().mockResolvedValue({ _id: 'user-1' }),
      forgotPassword: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects malformed registration bodies before the service layer', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', unexpected: true })
      .expect(400);

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('normalizes valid registration bodies before the service layer', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ADA@EXAMPLE.COM ',
        password: 'password123',
        firstName: ' Ada ',
        lastName: ' Lovelace ',
      })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('rejects malformed development login bodies before the service layer', async () => {
    await request(app.getHttpServer())
      .post('/auth/dev-login')
      .send({ email: 'not-an-email', password: '' })
      .expect(400);

    expect(authService.devLogin).not.toHaveBeenCalled();
  });

  it('rejects malformed forgot-password bodies before the service layer', async () => {
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('rejects malformed reset-password bodies before the service layer', async () => {
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'short', password: 'short' })
      .expect(400);

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});
