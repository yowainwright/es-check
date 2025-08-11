#!/usr/bin/env node
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const esCheck = require('./index.js');

export const { runChecks, loadConfig, createLogger } = esCheck;
export default esCheck;