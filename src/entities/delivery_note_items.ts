import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdDeliveryNoteItems {
    static table = 'delivery_note_items';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.delivery_notes_fk_id) {
            const dArr = (Array.isArray(event.delivery_notes_fk_id) ? event.delivery_notes_fk_id : [event.delivery_notes_fk_id]).filter(Boolean);
            if (dArr.length > 0) obj_fk.push({ delivery_notes: dArr });
        }

        return {
            db, table: 'delivery_note_items',
            attribute: {
                item_number: event.item_number || '',
                description: event.description || '',
                quantity: event.quantity || '',
                unit_price: event.unit_price || '',
                labor_cost: event.labor_cost || '',
                total_price: event.total_price || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.delivery_notes_fk_id || (Array.isArray(event.delivery_notes_fk_id) && event.delivery_notes_fk_id.length === 0)) {
            if (event.note_number) {
                const nId = await resolveId('delivery_notes', 'note_number', event.note_number, event, h);
                if (nId) event.delivery_notes_fk_id = [nId];
            }
        }
        let payload = GestionTallerProdDeliveryNoteItems.build_payload(event);
        return storeWithDeduplication('delivery_note_items', payload, 'description', event.description, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('delivery_note_items', id, GestionTallerProdDeliveryNoteItems.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('delivery_note_items', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('delivery_note_items', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('delivery_note_items', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('delivery_note_items', event);
    }
}
