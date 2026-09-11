import { BaseEntityHelpers, MiddlewareSecurity, getDbName } from 'skd-grql';
import { DB_VAR, baseEntityHelpers, middlewareSecurity } from '../config';


export class GestionTallerProdInspectionVideo {
    static table = 'inspection_video';

    static build_payload(event: any): any {
        const db = getDbName(event?.headerLambdaObject) || DB_VAR;
        let obj_fk: any[] = [];
        if (event.inspection_cards_fk_id) {
            obj_fk.push({
                inspection_cards: event.inspection_cards_fk_id ? (Array.isArray(event.inspection_cards_fk_id) ? event.inspection_cards_fk_id : [event.inspection_cards_fk_id]) : []
            });
        }
        if (event.usuarios_fk_id) {
            obj_fk.push({
                usuarios: event.usuarios_fk_id ? (Array.isArray(event.usuarios_fk_id) ? event.usuarios_fk_id : [event.usuarios_fk_id]) : []
            });
        }

        const attachmentId = event.attachmentId || event.attachment_id || event.fileMeta?.id || '';

        return {
            db, table: 'inspection_video',
            attribute: {
                video_url: event.video_url || attachmentId || '',
                attachmentId,
                filename: event.filename || '',
                duration: Number(event.duration || 0),
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const s = sec || middlewareSecurity;
        const auth = await s.auth(event);
        let payload = GestionTallerProdInspectionVideo.build_payload(event);
        const userId = auth?.id || event.usuarios_fk_id || event.userId || '';
        if (userId) {
            payload.obj_fk = payload.obj_fk.filter((item: any) => !item.usuarios);
            payload.obj_fk.push({ usuarios: [userId] });
        }
        return h.store('inspection_video', payload);
    }
}
