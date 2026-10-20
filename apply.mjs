#!/usr/bin/env node
// Applies / removes the "download by App ID" add-on.
//   node appid-addon/apply.mjs [--remove] [--check]   (run from the project root)
// Idempotent: running it twice is safe. It copies files/* into
// frontend/src/addons/appid/ and makes ONE small edit to AddDownload.tsx.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const target = path.join(root, 'frontend/src/addons/appid');
const page = path.join(root, 'frontend/src/components/Download/AddDownload.tsx');
const remove = process.argv.includes('--remove');
const check = process.argv.includes('--check');

const IMPORT = "import AppIdDownload from '../../addons/appid/AppIdDownload';\n";
const JSX = '        <AppIdDownload />\n';
const fail = (m) => {
  console.error('ERROR: ' + m);
  process.exit(1);
};

if (!fs.existsSync(page)) fail('Cannot find ' + page + ' - run from the project root.');
let src = fs.readFileSync(page, 'utf8');
const crlf = src.includes('\r\n');
if (crlf) src = src.replace(/\r\n/g, '\n');
const applied = src.includes(IMPORT) && src.includes(JSX);

if (check) {
  console.log(applied ? 'add-on is applied' : 'add-on is NOT applied');
  process.exit(applied ? 0 : 2);
}

if (remove) {
  src = src.replace(IMPORT, '').replace(JSX, '');
  fs.rmSync(target, { recursive: true, force: true });
  console.log('Removed add-on.');
} else {
  fs.mkdirSync(target, { recursive: true });
  for (const f of fs.readdirSync(path.join(here, 'files'))) {
    fs.copyFileSync(path.join(here, 'files', f), path.join(target, f));
  }
  if (!applied) {
    const lastImport = [...src.matchAll(/^import .*;\n/gm)].pop();
    const close = src.match(/\n( *)<\/div>\n *<\/PageContainer>/);
    if (!lastImport || !close) {
      fail(
        'AddDownload.tsx changed too much to patch automatically. Add manually:\n' +
          '  1) ' +
          IMPORT.trim() +
          '\n  2) <AppIdDownload /> as the last child inside the main <div> before </PageContainer>',
      );
    }
    const at = close.index + 1; // start of the "</div>" line
    src = src.slice(0, at) + JSX + src.slice(at);
    const end = lastImport.index + lastImport[0].length;
    src = src.slice(0, end) + IMPORT + src.slice(end);
  }
  console.log('Applied add-on.');
}
fs.writeFileSync(page, crlf ? src.replace(/\n/g, '\r\n') : src);
