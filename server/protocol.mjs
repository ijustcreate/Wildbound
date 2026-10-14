import {cleanInput} from '../src/rooms.mjs';
export const PROTOCOL_VERSION = 1;
export const MAX_MESSAGE_BYTES = 8192;
export const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024;
const actions = new Set(['portal','usePotion','openInventory','leaveRoom','openForestPassage']);
export function validateLocation(value) {
  if (!value || !['pack','chest','gear'].includes(value.mode)) throw Error('Invalid inventory location.');
  if (value.mode === 'gear') {
    if (!['head','chest','pants','feet','gloves','cape','shoulders','neck','back','hand1','hand2'].includes(value.slot)) throw Error('Invalid equipment slot.');
    return {mode:value.mode,slot:value.slot};
  }
  if (!Number.isInteger(value.index) || value.index < 0 || value.index > (value.mode === 'pack' ? 23 : 4095)) throw Error('Invalid inventory index.');
  return {mode:value.mode,index:value.index};
}
function validateMessage(raw) {
  if (Buffer.byteLength(raw) > MAX_MESSAGE_BYTES) throw Error('Message too large.');
  let message;
  try { message = JSON.parse(raw); } catch { throw Error('Malformed JSON.'); }
  if (!message || typeof message !== 'object' || Array.isArray(message)) throw Error('Expected a message object.');
  if (message.type === 'hello') {
    if (message.version !== PROTOCOL_VERSION) throw Error('Protocol version mismatch. Update the game client.');
    if (typeof message.name !== 'string' || !/^[\p{L}\p{N} _'-]{1,16}$/u.test(message.name) || !message.name.trim()) throw Error('Use a character name from 1 to 16 letters or numbers.');
    if (typeof message.joinToken !== 'string' || message.joinToken.length > 256) throw Error('A server join key is required.');
    if (message.resumeToken !== undefined && !/^[a-f0-9]{64}$/.test(message.resumeToken)) throw Error('Invalid reconnect credential.');
    return {type:'hello',version:message.version,name:message.name.trim(),joinToken:message.joinToken,resumeToken:message.resumeToken};
  }
  if (message.type === 'probe' && /^[a-f0-9]{32}$/.test(message.nonce)) return {type:'probe',nonce:message.nonce};
  if (!Number.isSafeInteger(message.seq) || message.seq < 0) throw Error('A non-negative sequence number is required.');
  if (message.type === 'input') {
    if (!message.input || typeof message.input !== 'object' || Array.isArray(message.input)) throw Error('Invalid input.');
    for (const [key,value] of Object.entries(message.input)) {
      if (['x','y','aimX','aimY'].includes(key)) { if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value)>1) throw Error('Input axis outside range.'); }
      else if (typeof value !== 'boolean') throw Error('Input buttons must be booleans.');
    }
    return {type:'input',seq:message.seq,input:cleanInput(message.input)};
  }
  if (message.type === 'action') {
    if (message.action === 'inventoryAction') {
      if (typeof message.arg !== 'string' || message.arg.length > 96 || !/^[\p{L}\p{N} _:'+.-]{1,96}$/u.test(message.arg)) throw Error('Invalid inventory action.');
      if (/^(select|split):/.test(message.arg) && !/^(select|split):\d{1,4}$/.test(message.arg)) throw Error('Invalid selection or stack amount.');
      return {type:'action',seq:message.seq,action:message.action,arg:message.arg};
    }
    if (message.action === 'openInventory') {
      if (message.arg != null && !(Number.isInteger(message.arg) && message.arg >= 0 && message.arg <= 2) && !['shared','starter','old-well','temple','victory'].includes(message.arg)) throw Error('Invalid storage.');
      return {type:'action',seq:message.seq,action:message.action,arg:message.arg ?? null};
    }
    if (message.action === 'openShop' && ['robot','vending'].includes(message.arg)) return {type:'action',seq:message.seq,action:message.action,arg:message.arg};
    if (message.action === 'moveInventoryItem') return {type:'action',seq:message.seq,action:message.action,arg:{from:validateLocation(message.arg?.from),to:validateLocation(message.arg?.to)}};
    if (message.action === 'bagTransfer') {
      if (!message.arg || !['store','take','close'].includes(message.arg.operation) || !Number.isInteger(message.arg.index) || message.arg.index < 0 || message.arg.index > 4095) throw Error('Invalid bag operation.');
      return {type:'action',seq:message.seq,action:message.action,arg:{operation:message.arg.operation,index:message.arg.index,mode:message.arg.mode==='chest'?'chest':'pack'}};
    }
    if (['craft','trainSkill','trapMode','tamePet','feedPet','deployBarricade'].includes(message.action)) {
      if (message.arg !== undefined && (typeof message.arg !== 'string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(message.arg))) throw Error('Invalid field action.');
      return {type:'action',seq:message.seq,action:message.action,arg:message.arg};
    }
    if (message.action === 'renamePet') {
      if (typeof message.arg?.name !== 'string' || !message.arg.name.trim() || message.arg.name.length>24 || !/^#[a-f0-9]{6}$/i.test(message.arg.collar)) throw Error('Invalid companion name or collar.');
      return {type:'action',seq:message.seq,action:message.action,arg:{name:message.arg.name,collar:message.arg.collar}};
    }
    if (!actions.has(message.action) || message.arg !== undefined) throw Error('Unknown action.');
    return {type:'action',seq:message.seq,action:message.action};
  }
  throw Error('Unknown message type.');
}
export function parseMessage(raw) {
  const message = validateMessage(raw);
  const requestId = JSON.parse(raw).requestId;
  if (requestId !== undefined) {
    if (!Number.isSafeInteger(requestId) || requestId < 0 || message.type !== 'action') throw Error('Invalid action request ID.');
    message.requestId = requestId;
  }
  return message;
}
