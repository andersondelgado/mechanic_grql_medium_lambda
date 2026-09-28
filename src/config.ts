import * as fs from 'fs';
import * as path from 'path';
import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';

// Automatically load .env if running standalone or in test environments
try {
    const envCandidatePaths = [
        path.resolve(__dirname, '..', '.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '..', '.env.production'),
        path.resolve(process.cwd(), '.env.production')
    ];
    for (const envPath of envCandidatePaths) {
        if (fs.existsSync(envPath)) {
            const raw = fs.readFileSync(envPath, 'utf-8');
            for (const line of raw.split(/\r?\n/)) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const k = trimmed.substring(0, eqIdx).trim();
                    let v = trimmed.substring(eqIdx + 1).trim();
                    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                        v = v.slice(1, -1);
                    }
                    if (!process.env[k]) {
                        process.env[k] = v;
                    }
                }
            }
            break;
        }
    }
} catch { }


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Embedded Config
export const DOMAIN = process.env.DOMAIN || 'https://db-grql.com';
export const API_KEY = process.env.API_KEY || 'TW5kemFreFRiM0JVYWtRMlYxRkZlblJVV1VsYVowTkdiM1U0ZDNCTVNtNGlmQ0phUjFZeVdWaENkMHh0VW14aVIyUkJXakl4YUdGWGQzVlpNamwwWmtjeGFGa3lhSEJpYlZaSVdWaEthRm95VlQwPSItIk1uZHpha3hUYjNCVWFrUTJWMUZGZW5SVVdVbGFaME5HYjNVNGQzQk1TbTQ9Ii4iWVc1a00zSnpNRzR1WkdWMk0yeHZjRzB6Ym5RPQ==';
export const SECRET_KEY = process.env.JWT_SECRET || 's3cr3te_secure_key_32_bytes_long_minimum';
export const DB_NAME = process.env.DB || 'GestionTallerProd';

export let API_KEY_VAR = API_KEY;
const envKey = process.env.key;
if (envKey) {
    try { API_KEY_VAR = JSON.parse(envKey).apiKey || API_KEY_VAR; } catch { }
}

export const DOMAIN_VAR = process.env.DOMAIN || DOMAIN;
export let DB_VAR = DB_NAME;

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

export function getDbNameWithEnv(): string {
    const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
    return 'GestionTallerProd' + envSuffix;
}

export function set_db(event: any): void {
    const header = event?.headerLambdaObject;
    if (!header) return;
    try {
        let obj = header;
        const missingPadding = obj.length % 4;
        if (missingPadding) obj += "=".repeat(4 - missingPadding);
        const decoded = Buffer.from(obj, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.environment) {
            const env = String(parsed.environment).trim() || "dev";
            DB_VAR = `${DB_NAME}-${env}`;
        }
    } catch { }
}

export let baseEntityHelpers = new BaseEntityHelpers({
    domain: DOMAIN_VAR,
    apiKey: API_KEY_VAR,
    secretKey: SECRET_KEY,
    dbName: DB_VAR
});

export let middlewareSecurity = new MiddlewareSecurity({
    domain: DOMAIN_VAR,
    apiKey: API_KEY_VAR,
    secretKey: SECRET_KEY,
    dbName: DB_VAR
});

export function refreshHelpers(): void {
    baseEntityHelpers = new BaseEntityHelpers({
        domain: DOMAIN_VAR,
        apiKey: API_KEY_VAR,
        secretKey: SECRET_KEY,
        dbName: DB_VAR
    });
    middlewareSecurity = new MiddlewareSecurity({
        domain: DOMAIN_VAR,
        apiKey: API_KEY_VAR,
        secretKey: SECRET_KEY,
        dbName: DB_VAR
    });
}
