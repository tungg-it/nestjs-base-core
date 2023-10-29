import * as morgan from 'morgan';
import config from '@config/configApp';
import { Logger } from '@nestjs/common';

const logger = new Logger('REQUEST');

// Create listen stream
const stream = {
  write: (message) => logger.log(message),
};

// Support fo development config
const skip = () => {
  const env = config().environment || 'development';
  return env !== 'development';
};

// Define format
const format =
  '[:method] HOST::remote-addr PATH::url CODE::status +:response-time ms';

// Create morgan middleware
const morganMiddleware = morgan(format, { stream, skip });

export default morganMiddleware;
