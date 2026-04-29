import dotenv from 'dotenv';
import path from 'path';

// __dirname resolves to dist/ in compiled output, so ../. env = server/.env
// This runs before any other module reads process.env
dotenv.config({ path: path.join(__dirname, '../.env') });
