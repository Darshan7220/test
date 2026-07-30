import 'dotenv/config';

import path from 'node:path';
import { createApp } from './app.js';
import { getConfig } from './config.js';
import { UserStore } from './storage/userStore.js';

async function start() {
  const config = getConfig();
  const userStore = new UserStore(path.resolve(process.cwd(), 'data', 'users.json'));
  await userStore.init();

  const app = createApp({ config, userStore });
  app.listen(config.port, () => {
    console.log(`Authentication API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Unable to start the server:', error.message);
  process.exitCode = 1;
});
