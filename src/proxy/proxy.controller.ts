import { All, Controller, Logger, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

const logger = new Logger('ApiGateway');

function makeProxy(target: string, label: string, extra: object = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ...extra,
    on: {
      proxyReq: (proxyReq, req: Request) => {
        fixRequestBody(proxyReq, req);
        logger.log(`→ [${label}] ${req.method} ${req.originalUrl} → ${target}${proxyReq.path}`);
      },
      proxyRes: (proxyRes, req: Request) => {
        logger.log(`← [${label}] ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      },
      error: (err: Error, req: Request, res: Response) => {
        logger.error(`✗ [${label}] ${req.method} ${req.originalUrl} — ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Bad Gateway', detail: err.message });
        }
      },
    },
  });
}

const GAME_SERVICE_URL =
  `http://${process.env.GAME_SERVICE_HOST ?? 'localhost'}:${process.env.GAME_SERVICE_PORT ?? '3003'}`;
const USER_SERVICE_URL =
  `http://${process.env.USER_SERVICE_HOST ?? 'localhost'}:${process.env.USER_SERVICE_PORT ?? '3001'}`;
const NOTIFICATION_SERVICE_URL =
  `http://${process.env.NOTIFICATION_SERVICE_HOST ?? 'localhost'}:${process.env.NOTIFICATION_SERVICE_PORT ?? '3002'}`;

const gameProxy = makeProxy(GAME_SERVICE_URL, 'game');
const userProxy = makeProxy(USER_SERVICE_URL, 'user');
const notifProxy = makeProxy(NOTIFICATION_SERVICE_URL, 'notif', { ws: true });

@Controller()
export class ProxyController {
  @All(['game/*', 'round/*', 'player', 'chat', 'chat/*'])
  proxyGame(@Req() req: Request, @Res() res: Response): void {
    gameProxy(req, res, () => {});
  }

  @All(['login', 'logout', 'register', 'reset-password', 'guest', 'statistic', 'statistic/*', 'user/*'])
  proxyUser(@Req() req: Request, @Res() res: Response): void {
    userProxy(req, res, () => {});
  }

  @All(['notify', 'notify/*'])
  proxyNotif(@Req() req: Request, @Res() res: Response): void {
    notifProxy(req, res, () => {});
  }

  @All('health')
  health(@Res() res: Response): void {
    res.status(200).json({ status: 'ok' });
  }
}
