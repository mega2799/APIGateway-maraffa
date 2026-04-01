import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ProxyModule } from './proxy/proxy.module';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'maraffa-default-secret-change-in-prod',
    }),
    ProxyModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'login', method: RequestMethod.POST },
        { path: 'register', method: RequestMethod.POST },
        { path: 'guest', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
        { path: 'statistic/(.*)', method: RequestMethod.POST },
        { path: 'statistic', method: RequestMethod.POST },
        { path: 'notify', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
