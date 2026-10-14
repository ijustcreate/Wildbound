import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const encode = value => JSON.stringify(value, (_key, item) => item instanceof Set ? {$wildboundSet:[...item]} : item);
export const decode = text => JSON.parse(text, (_key, item) => item && Object.keys(item).length === 1 && Array.isArray(item.$wildboundSet) ? new Set(item.$wildboundSet) : item);

export class WorldStore {
  constructor(file) { this.file = file; this.queue = Promise.resolve(); }
  async load(validate) {
    try {
      const data = decode(await fs.readFile(this.file,'utf8'));
      validate(data);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // A missing primary with an existing backup is a recovery, not a new world.
        try { const data = decode(await fs.readFile(this.file+'.bak','utf8')); validate(data); this.recovered = true; return data; }
        catch (backup) { if (backup.code === 'ENOENT') return null; throw backup; }
      }
      try { const data = decode(await fs.readFile(this.file+'.bak','utf8')); validate(data); this.recovered = true; return data; }
      catch { throw Error(`World save is invalid; preserved primary and backup. ${error.message}`); }
    }
  }
  write(value) {
    // Capture synchronously so an in-flight tick cannot alter the saved revision.
    const body = encode(value)+'\n';
    const operation = async () => {
      await fs.mkdir(path.dirname(this.file), {recursive:true});
      const temp = this.file+'.'+randomUUID()+'.tmp';
      try {
        const fd = await fs.open(temp,'wx',0o600);
        try { await fd.writeFile(body); await fd.sync(); } finally { await fd.close(); }
        if (!this.recovered) {
          try { await fs.copyFile(this.file, this.file+'.bak'); }
          catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        await fs.rename(temp, this.file);
        this.recovered = false;
      } finally { await fs.rm(temp,{force:true}); }
    };
    const result = this.queue.then(operation);
    this.queue = result.catch(()=>{});
    return result;
  }
}
