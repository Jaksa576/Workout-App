import { execSync } from 'node:child_process';
execSync('npx vitest run lib/__tests__/exercise-catalog-report.test.ts --reporter=dot', { stdio: 'inherit' });
