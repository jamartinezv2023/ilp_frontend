import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
const root = realpathSync('.');
const lcov = readFileSync('coverage/lcov.info', 'utf8');
let files = 0, lines = 0, covered = 0;
for (const record of lcov.split('end_of_record')) {
  const source = /^SF:(.+)$/m.exec(record)?.[1]?.trim();
  if (!source) continue;
  const target = resolve(root, source);
  if (!existsSync(target)) throw new Error(`Coverage source does not exist: ${source}`);
  const rel = relative(root, realpathSync(target)).replaceAll('\\', '/');
  if (isAbsolute(rel) || !rel.startsWith('src/') || rel.startsWith('../')) throw new Error(`Coverage source outside src: ${source}`);
  files++;
  lines += Number(/^LF:(\d+)$/m.exec(record)?.[1] ?? 0);
  covered += Number(/^LH:(\d+)$/m.exec(record)?.[1] ?? 0);
}
if (files === 0 || lines === 0 || covered === 0) throw new Error('Coverage is empty or contains no exercised source lines');
for (const source of ['src/services/assessmentApi.ts','src/i18n/I18nProvider.tsx','src/pages/assessment/components/KolbRealForm.tsx','src/features/assessment-engine/services/authorizedScientificApi.ts']) {
  if (!lcov.replaceAll('\\', '/').includes(source)) throw new Error(`Required boundary absent from LCOV: ${source}`);
}
console.log(`LCOV_SOURCES=${files}\nLCOV_LINES=${lines}\nLCOV_COVERED_LINES=${covered}\nLCOV_IMPORT_INPUT_VALID=True`);
console.log('NEW_CODE_80_PERCENT_GATE=SONARCLOUD_REVIEW_REQUIRED');
