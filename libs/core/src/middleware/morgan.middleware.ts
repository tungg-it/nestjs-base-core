import morgan from 'morgan';
import { Logger } from '@nestjs/common';
import configuration from '@libs/core/config';

const logger = new Logger('HTTP');

// Create listen stream
const stream = {
  write: (message: string) => logger.log(message.replace(/\n$/, '').trim()),
};

// Support fo development config
const skip = () => {
  const env = configuration().environment || 'development';
  return env !== 'development';
};

// Define format
const format =
  '[:method] HOST::remote-addr PATH::url CODE::status +:response-time ms';

// Create morgan middleware
// eslint-disable-next-line
const morganMiddleware = morgan(format, { stream, skip });

export default morganMiddleware;
