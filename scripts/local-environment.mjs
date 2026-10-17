import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const result = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const url = result.API_URL;
const key = result.PUBLISHABLE_KEY ?? result.ANON_KEY;
if (url !== 'http://127.0.0.1:55321' || typeof key !== 'string') throw new Error('Se esperaba el proyecto local identity-dev en 55321.');
writeFileSync('src/environments/environment.local.ts', `// Generado para desarrollo local. No contiene claves secretas.\nexport const environment = ${JSON.stringify({ production: false, supabaseUrl: url, supabaseAnonKey: key }, null, 2)};\n`);
console.log('Entorno Angular local generado; no se mostraron claves.');
