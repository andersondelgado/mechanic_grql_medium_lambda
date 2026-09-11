import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache, resolveId } from '../helpers/fk_cache';

export class GestionTallerProdDeliveryNotes {
    static table = 'delivery_notes';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.vehicles_fk_id) {
            const vArr = (Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id : [event.vehicles_fk_id]).filter(Boolean);
            if (vArr.length > 0) obj_fk.push({ vehicles: vArr });
        }
        if (event.clients_fk_id) {
            const cArr = (Array.isArray(event.clients_fk_id) ? event.clients_fk_id : [event.clients_fk_id]).filter(Boolean);
            if (cArr.length > 0) obj_fk.push({ clients: cArr });
        }

        return {
            db, table: 'delivery_notes',
            attribute: {
                note_number: event.note_number || '',
                note_date: event.note_date || '',
                client_name: event.client_name || '',
                tax_id: event.tax_id || '',
                vehicle_type: event.vehicle_type || '',
                brand: event.brand || '',
                model: event.model || '',
                license_plate: event.license_plate || '',
                subtotal: event.subtotal || '',
                total: event.total || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.clients_fk_id || (Array.isArray(event.clients_fk_id) && event.clients_fk_id.length === 0)) {
            let cId = event.tax_id ? await resolveId('clients', 'tax_id', event.tax_id, event, h) : null;
            if (!cId && event.client_name) {
                cId = await resolveId('clients', 'client_name', event.client_name, event, h);
            }
            if (!cId && event.license_plate) {
                const plateKey = `vehicle_to_client:${String(event.license_plate).trim().toUpperCase()}`;
                if (fkCache[plateKey]) {
                    cId = fkCache[plateKey];
                }
            }
            if (cId) event.clients_fk_id = [cId];
        }
        if (!event.vehicles_fk_id || (Array.isArray(event.vehicles_fk_id) && event.vehicles_fk_id.length === 0)) {
            if (event.license_plate) {
                const vId = await resolveId('vehicles', 'license_plate', event.license_plate, event, h);
                if (vId) event.vehicles_fk_id = [vId];
            }
        }
        let payload = GestionTallerProdDeliveryNotes.build_payload(event);
        const res = await storeWithDeduplication('delivery_notes', payload, 'note_number', event.note_number, event, h);
        if (res?.id && event.note_number) {
            fkCache[`delivery_notes:note_number:${String(event.note_number).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('delivery_notes', id, GestionTallerProdDeliveryNotes.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('delivery_notes', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('delivery_notes', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('delivery_notes', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('delivery_notes', event);
    }
}
