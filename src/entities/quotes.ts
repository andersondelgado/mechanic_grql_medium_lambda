import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache, resolveId } from '../helpers/fk_cache';

export class GestionTallerProdQuotes {
    static table = 'quotes';

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
            db, table: 'quotes',
            attribute: {
                quote_number: event.quote_number || '',
                quote_date: event.quote_date || '',
                client_name: event.client_name || '',
                tax_id: event.tax_id || '',
                vehicle_type: event.vehicle_type || '',
                brand: event.brand || '',
                model: event.model || '',
                address: event.address || '',
                license_plate: event.license_plate || '',
                year: event.year || '',
                subtotal: event.subtotal || '',
                total: event.total || '',
                status: event.status || '',
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
                try {
                    const vRes = await h.data_filter('vehicles', {
                        filter: { field: 'license_plate', value: String(event.license_plate).trim() },
                        headerLambda: event?.headerLambda,
                        headerLambdaObject: event?.headerLambdaObject
                    });
                    const vItems = vRes?.content || (Array.isArray(vRes) ? vRes : []);
                    if (vItems.length > 0 && vItems[0].clients_fk_id) {
                        const rawFk = vItems[0].clients_fk_id;
                        cId = Array.isArray(rawFk) ? rawFk[0] : rawFk;
                    }
                } catch { }
            }
            if (cId) event.clients_fk_id = [cId];
        }
        if (!event.vehicles_fk_id || (Array.isArray(event.vehicles_fk_id) && event.vehicles_fk_id.length === 0)) {
            if (event.license_plate) {
                const vId = await resolveId('vehicles', 'license_plate', event.license_plate, event, h);
                if (vId) event.vehicles_fk_id = [vId];
            }
        }
        let payload = GestionTallerProdQuotes.build_payload(event);
        const res = await storeWithDeduplication('quotes', payload, 'quote_number', event.quote_number, event, h);
        if (res?.id && event.quote_number) {
            fkCache[`quotes:quote_number:${String(event.quote_number).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }


    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('quotes', id, GestionTallerProdQuotes.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('quotes', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('quotes', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('quotes', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('quotes', event);
    }
}
