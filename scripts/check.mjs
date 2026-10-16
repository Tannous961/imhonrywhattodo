import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const folder of ['server','public','test'])for(const file of readdirSync(path.join(root,folder)))if(/\.(?:m?js)$/.test(file))execFileSync(process.execPath,['--check',path.join(root,folder,file)],{stdio:'inherit'});
console.log('JavaScript syntax checks passed.');
