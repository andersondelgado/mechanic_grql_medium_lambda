import { BaseEntityHelpers, MiddlewareSecurity, getDbName } from 'skd-grql';
import { DB_VAR, baseEntityHelpers, middlewareSecurity } from '../config';


export class GestionTallerProdInspectionAnalysis {
    static table = 'inspection_analysis';

    static build_payload(event: any): any {
        const db = getDbName(event?.headerLambdaObject) || DB_VAR;
        let obj_fk: any[] = [];
        if (event.inspection_cards_fk_id) {
            obj_fk.push({
                inspection_cards: event.inspection_cards_fk_id ? (Array.isArray(event.inspection_cards_fk_id) ? event.inspection_cards_fk_id : [event.inspection_cards_fk_id]) : []
            });
        }

        return {
            db, table: 'inspection_analysis',
            attribute: {
                damage_type: event.damage_type || 'otros',
                damage_severity: event.damage_severity || 'moderado',
                affected_parts: event.affected_parts || [],
                repair_estimated_hours: Number(event.repair_estimated_hours || 0),
                parts_needed: event.parts_needed || [],
                confidence_score: Number(event.confidence_score || 0),
                observations: event.observations || '',
                recommended_actions: event.recommended_actions || [],
                status: event.status || 'completado',
            },
            obj_fk
        };
    }

    static async custom_function(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const s = sec || middlewareSecurity;
        await s.auth(event);
        const db = getDbName(event?.headerLambdaObject) || DB_VAR;

        const videoUrl: string = event.video_url || '';
        if (!videoUrl) {
            return { error: { message: "No video URL provided for analysis" }, statusCode: 400 };
        }

        const geminiKey: string = event.gemini_api_key || '';
        if (!geminiKey) {
            return { error: { message: "gemini_api_key is required" }, statusCode: 400 };
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [
                                { fileData: { fileUri: videoUrl, mimeType: event.file_mime_type || 'video/mp4' } },
                                { text: 'Eres un perito automotriz experto. Analiza el video del vehiculo y devuelve JSON estricto con: damage_type, damage_severity (leve|moderado|severo), affected_parts (array), repair_estimated_hours (number), parts_needed (array), confidence_score (0-100), observations, recommended_actions (array).' }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4096,
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                return { error: { message: `Gemini API error: ${response.status} - ${errorText}` }, statusCode: response.status };
            }

            const geminiData = await response.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';

            let analysisResult: any = {};
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) analysisResult = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                analysisResult = { observations: text.substring(0, 500) };
            }

            const analysisPayload = GestionTallerProdInspectionAnalysis.build_payload({
                ...event,
                damage_type: analysisResult.damage_type || event.damage_type || 'otros',
                damage_severity: analysisResult.damage_severity || event.damage_severity || 'moderado',
                affected_parts: analysisResult.affected_parts || event.affected_parts || [],
                repair_estimated_hours: Number(analysisResult.repair_estimated_hours || 0),
                parts_needed: analysisResult.parts_needed || event.parts_needed || [],
                confidence_score: Number(analysisResult.confidence_score || 0),
                observations: analysisResult.observations || text.substring(0, 500) || event.observations || '',
                recommended_actions: analysisResult.recommended_actions || event.recommended_actions || [],
                status: 'completado',
            });

            const storeResult = await h.store('inspection_analysis', analysisPayload);

            const inspectionCardsId = event.inspection_cards_fk_id || event.inspection_cardsId || '';
            if (!storeResult?.error && inspectionCardsId) {
                await h.update('inspection_cards', inspectionCardsId, {
                    db, table: 'inspection_cards',
                    attribute: { status: 'completado' },
                });
            }

            return {
                success: true,
                analysis: analysisResult,
                video_url: videoUrl,
                analysis_id: storeResult?.id,
            };
        } catch (e: any) {
            return { error: { message: e.message || "Analysis failed" }, statusCode: 500 };
        }
    }
}
