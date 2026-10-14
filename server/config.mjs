import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultConfigPath = path.join(root, 'server-data', 'config.json');
export function validateConfig(config) {
  for (const key of ['port','adminPort'])
    if (!Number.isInteger(config[key]) || config[key] < 0 || config[key] > 65535) throw Error(`Invalid ${key}.`);
  if (!['127.0.0.1','localhost','::1'].includes(config.adminHost)) throw Error('The admin listener must use loopback.');
  if (typeof config.bind !== 'string' || !config.bind) throw Error('Configure a game bind address.');
  if (typeof config.adminToken !== 'string' || config.adminToken.length < 32) throw Error('Admin token must contain at least 32 characters.');
  if (typeof config.joinToken !== 'string' || config.joinToken.length < 32) throw Error('Join key must contain at least 32 characters.');
  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed >= 1000000) throw Error('Seed must be a whole number from 0 to 999999.');
  if (!Number.isInteger(config.maxPlayers) || config.maxPlayers < 1 || config.maxPlayers > 6) throw Error('Maximum players must be from 1 to 6.');
  if (config.publicAddress) {
    const url = new URL(config.publicAddress);
    if (!['ws:','wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/game') throw Error('Public address must be ws://host:port/game or wss://host/game.');
  }
  if (typeof config.savePath !== 'string' || !config.savePath) throw Error('Configure a server save path.');
  if (config.publicTunnel !== undefined && !['none','quick'].includes(config.publicTunnel)) throw Error('Public tunnel must be none or quick.');
  if (config.publicTunnel === 'quick' && config.bind === '::1') throw Error('Quick Tunnel requires an IPv4 game listener.');
  return config;
}
export async function loadConfig(file = defaultConfigPath, {initialize = false} = {}) {
  file = path.resolve(file);
  if (initialize) {
    await fs.mkdir(path.dirname(file), {recursive:true});
    const config = {version:1, bind:'127.0.0.1', port:4183, adminHost:'127.0.0.1', adminPort:4184,
      publicAddress:'', publicTunnel:'none', savePath:'world-v1.json', seed: Math.floor(Math.random()*1000000), maxPlayers:6,
      adminToken:randomBytes(32).toString('hex'), joinToken:randomBytes(32).toString('hex')};
    try { await fs.writeFile(file, JSON.stringify(config,null,2)+'\n', {flag:'wx',mode:0o600}); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  let config;
  try { config = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { throw Error(`Cannot read server configuration ${file}. Run node server/start.mjs --init first. ${error.message}`); }
  if (config.version !== 1) throw Error('Unsupported server configuration version.');
  config = validateConfig(config);
  config.savePath = path.resolve(path.dirname(file), config.savePath);
  return config;
}
