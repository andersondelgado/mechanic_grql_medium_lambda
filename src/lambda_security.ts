import * as jwt from 'jsonwebtoken';

// Embedded Config
const DOMAIN = process.env.DOMAIN || 'https://db-grql.com';
const API_KEY = process.env.API_KEY || 'TW5kemFreFRiM0JVYWtRMlYxRkZlblJVV1VsYVowTkdiM1U0ZDNCTVNtNGlmQ0phUjFZeVdWaENkMHh0VW14aVIyUkJXakl4YUdGWGQzVlpNamwwWmtjeGFGa3lhSEJpYlZaSVdWaEthRm95VlQwPSItIk1uZHpha3hUYjNCVWFrUTJWMUZGZW5SVVdVbGFaME5HYjNVNGQzQk1TbTQ9Ii4iWVc1a00zSnpNRzR1WkdWMk0yeHZjRzB6Ym5RPQ==';
const SECRET_KEY = process.env.JWT_SECRET || 's3cr3te_secure_key_32_bytes_long_minimum';
const DB_NAME = process.env.DB || 'GestionTallerProd';

function getDbName(headerLambdaObject?: string): string {
    if (!headerLambdaObject) return DB_NAME;
    try {
        let obj = headerLambdaObject;
        const missingPadding = obj.length % 4;
        if (missingPadding) obj += "=".repeat(4 - missingPadding);
        const decoded = Buffer.from(obj, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.environment) {
            const env = String(parsed.environment).trim() || "dev";
            return `${DB_NAME}-${env}`;
        }
    } catch { }
    return DB_NAME;
}

class Security {
    static async request(endpoint: string, method: string, body?: any, headers?: any): Promise<any> {
        const reqHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(headers || {})
        };

        // Capture request details
        // console.error(`[gRQL Lambda Request] ${method} ${endpoint}`);
        // console.error(`[gRQL Lambda Request Headers]`, JSON.stringify(reqHeaders));
        // if (body) {
        //     console.error(`[gRQL Lambda Request Body]`, JSON.stringify(body));
        // }

        try {
            const options: any = { method, headers: reqHeaders };
            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(endpoint, options);

            // Capture response details
            // console.error(`[gRQL Lambda Response Status] ${response.status}`);

            if (![200, 201].includes(response.status)) {
                try {
                    const errRes = await response.json();
                    // console.error(`[gRQL Lambda Response Error]`, JSON.stringify(errRes));
                    return { error: errRes };
                } catch {
                    const txtRes = await response.text();
                    // console.error(`[gRQL Lambda Response Text Error]`, txtRes);
                    return { error: { message: txtRes, status: response.status } };
                }
            }

            const successRes = await response.json();
            // console.error(`[gRQL Lambda Response Body]`, JSON.stringify(successRes));
            return successRes;
        } catch (e: any) {
            // console.error(`[gRQL Lambda Request Failure]`, e.message || e);
            return { error: { message: e.message || "Request failed" }, statusCode: 401 };
        }
    }

    static async login(payload: Record<string, any>): Promise<any> {
        const db = getDbName(payload.headerLambdaObject);
        const endpoint = `${DOMAIN}/api/secure-rQL/login-user/${db}`;
        const data = await Security.request(endpoint, "POST",
            { username: payload.username, password: payload.password },
            { "X-Grql-Auth": API_KEY }
        );
        if ("error" in data) return data;
        const token = jwt.sign({ token: data.accessToken }, SECRET_KEY, { algorithm: "HS256", expiresIn: '24h' });
        return { token };
    }

    static async register(payload: Record<string, any>): Promise<any> {
        if (payload.password !== payload.passwordConfirmation) {
            return { error: { message: "passwords do not match" } };
        }
        const db = getDbName(payload.headerLambdaObject);
        const endpoint = `${DOMAIN}/api/secure-rQL/create-user/${db}?active=true`;
        return await Security.request(endpoint, "POST",
            { username: payload.username, password: payload.password },
            { "X-Grql-Auth": API_KEY }
        );
    }

    static async auth(headers: Record<string, any>): Promise<any> {
        try {
            const token = headers.headerLambda;
            if (!token) throw new Error("No token provided");
            const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as jwt.JwtPayload;
            const endpoint = `${DOMAIN}/api/secure-rQL/auth-user`;
            return await Security.request(endpoint, "GET", undefined,
                { "X-Grql-Auth-Client": decoded.token }
            );
        } catch (err: any) {
            return { error: { message: err.message || "Invalid Token" }, statusCode: 401 };
        }
    }
}

async function main() {
    process.stdin.setEncoding('utf-8');
    let input = '';
    for await (const chunk of process.stdin) input += chunk;

    try {
        if (!input.trim()) return;
        const event = JSON.parse(input);
        let decodeBase64: string | null = null;

        try {
            if (event.headerLambdaObject) {
                let headerObj = event.headerLambdaObject;
                const missingPadding = headerObj.length % 4;
                if (missingPadding) headerObj += "=".repeat(4 - missingPadding);
                decodeBase64 = Buffer.from(headerObj, 'base64').toString('utf-8');
            }
        } catch { }

        const header = event.headerLambda;
        const flows = event.request?.flows || [];
        const flow = flows.find((f: any) => f.name === "workflow_security");
        const output: Record<string, any> = {};

        if (flow) {
            const stepSecurity = (flow.steps || []).find((s: any) => s.name === "security");
            if (stepSecurity) {
                const actions = stepSecurity.actions || [];
                const signin = actions.find((a: any) => a.name === "signin" && a.action === "mutation");
                const signup = actions.find((a: any) => a.name === "signup" && a.action === "mutation");
                const auth = actions.find((a: any) => a.name === "auth" && a.action === "mutation");

                output.security = output.security || {};

                if (signin) {
                    const body = signin.params?.body || {};
                    if (decodeBase64) body.headerLambdaObject = decodeBase64;
                    output.security.signin = await Security.login(body);
                }
                if (signup) {
                    const body = signup.params?.body || {};
                    if (decodeBase64) body.headerLambdaObject = decodeBase64;
                    output.security.signup = await Security.register(body);
                }
                if (auth) {
                    const body = auth.params?.headers || {};
                    if (decodeBase64) body.headerLambdaObject = decodeBase64;
                    if (header) body.headerLambda = header;
                    output.security.auth = await Security.auth(body);
                }
            }
        }

        process.stdout.write(JSON.stringify(output) + '\n');
    } catch (error: any) {
        process.stdout.write(JSON.stringify({ error: { message: error.message || "Internal Server Error" } }) + '\n');
    }
}

main();
