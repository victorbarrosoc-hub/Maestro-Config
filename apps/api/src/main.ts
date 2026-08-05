import { Logger } from '@nestjs/common';
import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp();

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
  new Logger('Maestro').log(`API em http://localhost:${port}/v1`);
}

void bootstrap();
