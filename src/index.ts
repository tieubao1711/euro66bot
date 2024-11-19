import { config as configDotenv } from 'dotenv';
configDotenv();

import { bot } from './bot';
import { connectDatabase } from './database';

(async () => {
  await connectDatabase();
  bot.launch();
  console.log('Bot is running...');
})();
