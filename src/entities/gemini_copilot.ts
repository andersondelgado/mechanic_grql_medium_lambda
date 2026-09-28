import { getDbName } from 'skd-grql';
import { DB_VAR, GEMINI_API_KEY, GEMINI_MODEL, baseEntityHelpers } from '../config';

export class GeminiGarageCopilot {
    static table = 'gemini_copilot';

    /** Límite de base64 inline (Gemini limita el request a ~20MB). */
    static MAX_INLINE_BASE64_LENGTH = 14 * 1024 * 1024;

    static parseJsonCandidate(text: string): any {
        if (!text || typeof text !== 'string') return {};
        const trimmed = text.trim();
        try {
            return JSON.parse(trimmed);
        } catch { }
        // El modelo puede envolver el JSON en ```json ... ``` o incluir prosa alrededor
        const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fence && fence[1]) {
            try { return JSON.parse(fence[1].trim()); } catch { }
        }
        const match = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match && match[1]) {
            try { return JSON.parse(match[1]); } catch { }
        }
        return { raw_response: trimmed };
    }

    /**
     * Modelos candidatos: primero el configurado y luego respaldos conocidos.
     * Protege ante 503 "high demand" o modelos retirados (404).
     */
    static resolveModelCandidates(): string[] {
        const primary = GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
        const fallbacks = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
        return [primary, ...fallbacks.filter((m) => m !== primary)];
    }

    /**
     * Invoca `generateContent` con cadena de modelos candidatos + reintentos.
     * Devuelve el texto crudo del primer candidate (o lanza Error).
     * Reutilizable por otras capacidades de IA (p.ej. análisis de video por peritaje).
     */
    static async generateContentText(requestBody: any, maxRetries = 2, apiKeyOverride?: string): Promise<string> {
        const apiKey = apiKeyOverride || GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY no está configurada en la lambda.');
        }

        const body = JSON.stringify(requestBody);
        let lastError = '';
        for (const model of GeminiGarageCopilot.resolveModelCandidates()) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                });

                if (response.ok) {
                    const data: any = await response.json();
                    const parts = data?.candidates?.[0]?.content?.parts || [];
                    return parts.map((p: any) => p?.text || '').join('') || '{}';
                }

                const errText = await response.text();
                lastError = `Error en API Gemini (${model} / ${response.status}): ${errText}`;

                const isTransient = [429, 500, 502, 503].includes(response.status);
                if (isTransient && attempt < maxRetries) {
                    // Backoff exponencial ante sobrecarga / rate limit
                    await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    continue;
                }
                // Modelo descartado (no disponible o error no transitorio): siguiente candidato
                break;
            }
        }
        throw new Error(lastError || 'No hay modelos Gemini disponibles.');
    }

    static async callGeminiApi(systemInstruction: string, contents: any[]): Promise<any> {
        const apiKey = GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

        if (!apiKey) {
            return {
                warning: "GEMINI_API_KEY no está configurada en la lambda.",
                mock_generated: true,
                client_name: "Cliente Demo",
                vehicle_type: "Camioneta",
                brand: "Toyota",
                model: "Hilux",
                year: "2020",
                license_plate: "ABC-123",
                diagnostic: ["Revisión general del sistema de frenos"],
                items: [
                    { item_number: 1, description: "Balatas delanteras", quantity: 1, unit_price: 120, total_price: 120, product_name: "Balatas", product_brand: "Bosch", supplier_store: "Repuestos Mecánica" },
                    { item_number: 2, description: "Mano de obra frenos", quantity: 1, unit_price: 80, total_price: 80 }
                ],
                subtotal: 200,
                total: 240
            };
        }

        const candidateText = await GeminiGarageCopilot.generateContentText({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });
        return GeminiGarageCopilot.parseJsonCandidate(candidateText);
    }

    static detectAudioMimeType(base64: string, explicitMime?: string): string {
        if (explicitMime && explicitMime.trim()) {
            return explicitMime.trim();
        }
        if (!base64 || typeof base64 !== 'string') return 'audio/mp4';

        const head = base64.trim().slice(0, 32);
        // WebM EBML header empieza con 1A 45 DF A3 => en base64: "GkXf"
        if (head.startsWith('GkXf')) {
            return 'audio/webm';
        }
        // OggS container => 4F 67 67 53 => en base64: "T2dn"
        if (head.startsWith('T2dn')) {
            return 'audio/ogg';
        }
        // RIFF WAVE => 52 49 46 46 => en base64: "UklGR"
        if (head.startsWith('UklGR')) {
            return 'audio/wav';
        }
        // MP3 ID3 header => 49 44 33 => "SUQz" o sync words
        if (head.startsWith('SUQz') || head.startsWith('//O') || head.startsWith('//M')) {
            return 'audio/mp3';
        }
        // AAC ADTS header => FFF1, FFF9 => "/+4", "/+8"
        if (head.startsWith('/+4') || head.startsWith('/+8')) {
            return 'audio/aac';
        }
        return 'audio/mp4';
    }

    /**
     * Detecta el MIME del archivo a partir del base64 cuando el cliente no lo envía.
     * Cubre los formatos soportados por Gemini (imagen / audio / video).
     */
    static detectMediaMimeType(base64: string, explicitMime?: string): string {
        if (explicitMime && explicitMime.trim()) {
            return explicitMime.trim();
        }
        if (!base64 || typeof base64 !== 'string') return 'image/jpeg';

        const clean = base64.trim();
        const head = clean.slice(0, 24);
        if (head.startsWith('/9j/')) return 'image/jpeg';
        if (head.startsWith('iVBOR')) return 'image/png';
        if (head.startsWith('R0lGOD')) return 'image/gif';
        // RIFF: WEBP (imagen) o WAVE (audio)
        if (head.startsWith('UklGR')) return clean.includes('V0VC') ? 'image/webm' : 'audio/wav';
        // MP4/ISO BMFF: "ftyp" aparece desplazado en el base64 como "G...Z0eXB"
        if (head.startsWith('AAAA') && /G[A-Za-z0-9+\/]{0,2}Z0eXB/.test(clean.slice(0, 48))) return 'video/mp4';
        // WebM / Ogg pueden contener video o audio: preferimos video (más común en peritajes)
        if (head.startsWith('GkXf')) return 'video/webm';
        if (head.startsWith('T2dn')) return 'video/ogg';
        if (head.startsWith('SUQz') || head.startsWith('//O') || head.startsWith('//M')) return 'audio/mp3';
        if (head.startsWith('/+4') || head.startsWith('/+8')) return 'audio/aac';
        return 'image/jpeg';
    }

    static async generate_draft_quote(event: any): Promise<any> {
        const payload = event?.body || event;
        const systemInstruction = `Eres un Asistente de Presupuestos de Taller Mecánico de Élite (Taller Integral 360 / Urbaez Motors).
Extrae y estructura la solicitud de trabajo en formato JSON estricto con los siguientes campos (tabla 'quotes' + 'quote_items'):
- client_name (string)
- tax_id (string)
- vehicle_type (string)
- brand (string)
- model (string)
- year (string)
- license_plate (string)
- address (string)
- quote_date (string ISO o YYYY-MM-DD)
- status ("borrador")
- diagnostic (array de strings: hallazgos técnicos)
- recommended_actions (array de strings)
- items (array de objetos: item_number, description, quantity, unit_price, total_price, product_name, product_brand, supplier_store)
- subtotal (number)
- total (number, incluye impuestos si se mencionan)`;

        const parts: any[] = [];
        if (payload.audio_base64) {
            const detectedMime = GeminiGarageCopilot.detectAudioMimeType(payload.audio_base64, payload.mime_type || payload.mimeType);
            parts.push({
                inlineData: {
                    mimeType: detectedMime,
                    data: payload.audio_base64
                }
            });
        }
        if (payload.text_notes) {
            parts.push({ text: `Notas de la visita del vehículo:\n${payload.text_notes}` });
        }
        if (payload.vehicle_info) {
            parts.push({ text: `Datos del vehículo y cliente: ${JSON.stringify(payload.vehicle_info)}` });
        }

        return GeminiGarageCopilot.callGeminiApi(systemInstruction, [{ parts }]);
    }

    static async analyze_document(event: any): Promise<any> {
        const payload = event?.body || event;
        const systemInstruction = `Eres un asistente de análisis documental automotriz para Taller Integral 360. Analiza facturas, órdenes de compra, remitos o registros escaneados y extrae los datos relevantes en JSON estricto:
- document_type (string)
- provider (string)
- folio (string)
- issue_date (string)
- items (array: description, quantity, unit_price, total)
- subtotal (number)
- taxes (number)
- total (number)
- findings (array de strings con observaciones relevantes)`;
        const parts: any[] = [];
        if (payload.image_base64) {
            parts.push({
                inlineData: {
                    mimeType: payload.mime_type || payload.mimeType || 'image/jpeg',
                    data: payload.image_base64
                }
            });
        }
        parts.push({ text: payload.prompt_context || "Interpreta y estructura los datos del documento." });
        return GeminiGarageCopilot.callGeminiApi(systemInstruction, [{ parts }]);
    }

    /**
     * Peritaje multimedia: recibe un archivo convertido a base64 (imagen/audio/video)
     * o una video_url ya subida a la nube, lo envía a Gemini multimodal y persiste el
     * resultado en `inspection_analysis` (+ estado de la ficha a 'completado').
     */
    static async analyze_peritaje_media(event: any): Promise<any> {
        const payload = event?.body || event;

        const rawBase64 = payload.file_base64 || payload.image_base64 || payload.media_base64 || '';
        const fileBase64 = typeof rawBase64 === 'string' ? rawBase64.replace(/^data:[^;,]+;base64,/i, '').trim() : '';
        const videoUrl = typeof payload.video_url === 'string' ? payload.video_url.trim() : '';
        const explicitMime = (payload.mime_type || payload.mimeType || '').toString().trim();

        if (!fileBase64 && !videoUrl) {
            return { error: { message: 'Debe enviar el archivo en base64 (file_base64) o una video_url.' }, statusCode: 400 };
        }
        if (fileBase64.length > GeminiGarageCopilot.MAX_INLINE_BASE64_LENGTH) {
            return {
                error: {
                    message: 'El archivo en base64 supera el límite de envío inline (~10MB). Suba el video a la nube y envíe video_url.',
                },
                statusCode: 413,
            };
        }

        const systemInstruction = `Eres un perito automotriz experto para Taller Integral 360.
Analiza el material multimedia del vehículo (fotos, video o audio del peritaje) y devuelve JSON estricto con:
- damage_type (string: tipo de daño detectado)
- damage_severity (leve|moderado|severo)
- affected_parts (array de strings: piezas afectadas)
- repair_estimated_hours (number: horas de reparación)
- parts_needed (array de strings: repuestos necesarios)
- confidence_score (number 0-100)
- observations (string: dictamen del perito)
- recommended_actions (array de strings)`;

        const parts: any[] = [];
        if (fileBase64) {
            const mimeType = GeminiGarageCopilot.detectMediaMimeType(fileBase64, explicitMime);
            parts.push({ inlineData: { mimeType, data: fileBase64 } });
        } else {
            parts.push({ fileData: { fileUri: videoUrl, mimeType: explicitMime || 'video/mp4' } });
        }

        const context: string[] = [];
        if (payload.prompt_context) {
            context.push(`Contexto del peritaje:\n${payload.prompt_context}`);
        }
        if (payload.vehicle_context) {
            context.push(
                `Vehículo / cliente:\n${typeof payload.vehicle_context === 'string' ? payload.vehicle_context : JSON.stringify(payload.vehicle_context)}`
            );
        }
        if (payload.observations) {
            context.push(`Observaciones del inspector:\n${payload.observations}`);
        }
        parts.push({ text: context.join('\n\n') || 'Analiza el material adjunto del peritaje.' });

        let analysisResult: any;
        try {
            const text = await GeminiGarageCopilot.generateContentText({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json'
                }
            }, 2);
            analysisResult = GeminiGarageCopilot.parseJsonCandidate(text);
            if (analysisResult && !analysisResult.damage_type && analysisResult.raw_response) {
                analysisResult = { ...analysisResult, observations: analysisResult.raw_response };
            }
        } catch (e: any) {
            return { error: { message: e.message || 'Fallo al invocar Gemini para el peritaje' }, statusCode: 502 };
        }

        const analysis = {
            damage_type: analysisResult.damage_type || 'otros',
            damage_severity: analysisResult.damage_severity || 'moderado',
            affected_parts: analysisResult.affected_parts || [],
            repair_estimated_hours: Number(analysisResult.repair_estimated_hours || 0),
            parts_needed: analysisResult.parts_needed || [],
            confidence_score: Number(analysisResult.confidence_score || 0),
            observations: analysisResult.observations || '',
            recommended_actions: analysisResult.recommended_actions || [],
            status: 'completado',
        };

        let analysisId: string | undefined;
        if (payload.persist !== false && payload.persist !== 'false') {
            try {
                const db = getDbName(payload?.headerLambdaObject) || DB_VAR;
                const cardId = payload.inspection_cards_fk_id || payload.inspection_cardsId || '';
                const storeResult = await baseEntityHelpers.store('inspection_analysis', {
                    db,
                    table: 'inspection_analysis',
                    attribute: analysis,
                    obj_fk: cardId ? [{ inspection_cards: Array.isArray(cardId) ? cardId : [cardId] }] : [],
                    headerLambda: payload.headerLambda,
                    headerLambdaObject: payload.headerLambdaObject,
                });
                if (storeResult && !storeResult.error) {
                    analysisId = storeResult.id;
                    if (cardId && !Array.isArray(cardId)) {
                        await baseEntityHelpers.update('inspection_cards', cardId, {
                            db, table: 'inspection_cards',
                            attribute: { status: 'completado' },
                            headerLambda: payload.headerLambda,
                            headerLambdaObject: payload.headerLambdaObject,
                        });
                    }
                }
            } catch {
                // No se rompe la respuesta si falla el persist (la IA ya devolvió el dictamen)
            }
        }

        return {
            success: true,
            analysis,
            analysis_id: analysisId,
            source: fileBase64 ? 'base64' : 'video_url',
        };
    }

    static async suggest_parts(event: any): Promise<any> {
        const payload = event?.body || event;
        const systemInstruction = `Eres un recomendador de repuestos automotrices experto para Taller Integral 360. Devuelve un array JSON de objetos con { code, description, quantity, estimated_price, supplier, urgency } para los 5 repuestos más probables según los síntomas.`;
        const parts = [{
            text: `Síntomas del vehículo: ${payload.symptoms}. Impresión del técnico: ${payload.technical_impression || payload.diagnostic_impression || ''}`
        }];
        return GeminiGarageCopilot.callGeminiApi(systemInstruction, [{ parts }]);
    }

    static async custom_function(actionOrParams: any, event?: any): Promise<any> {
        let action = '';
        let payload: any = {};
        if (typeof actionOrParams === 'string') {
            action = actionOrParams;
            payload = event?.body || event;
        } else if (typeof actionOrParams === 'object' && actionOrParams !== null) {
            action = actionOrParams.action || actionOrParams.name || actionOrParams.params?.action || actionOrParams.body?.action || '';
            payload = actionOrParams.body || actionOrParams.params?.body || actionOrParams.params || actionOrParams;
        }

        // Si action sigue vacía, inferir automáticamente por los atributos presentes en payload
        if (!action && payload && typeof payload === 'object') {
            if (payload.audio_base64 || payload.text_notes || payload.vehicle_info) {
                action = 'generate_draft_quote';
            } else if (payload.file_base64 || payload.media_base64 || payload.video_url || payload.inspection_cards_fk_id) {
                action = 'analyze_peritaje_media';
            } else if (payload.image_base64 || payload.prompt_context) {
                action = 'analyze_document';
            } else if (payload.symptoms || payload.technical_impression || payload.diagnostic_impression) {
                action = 'suggest_parts';
            }
        }

        if (action === 'generate_draft_quote') return GeminiGarageCopilot.generate_draft_quote(payload);
        if (action === 'analyze_document') return GeminiGarageCopilot.analyze_document(payload);
        if (action === 'analyze_peritaje_media') return GeminiGarageCopilot.analyze_peritaje_media(payload);
        if (action === 'suggest_parts') return GeminiGarageCopilot.suggest_parts(payload);
        throw new Error(`Acción desconocida en GeminiGarageCopilot: ${action || JSON.stringify(actionOrParams)}`);
    }
}
