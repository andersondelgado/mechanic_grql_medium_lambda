import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache, resolveId } from '../helpers/fk_cache';

export class GestionTallerProdVehicles {
    static table = 'vehicles';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.clients_fk_id) {
            const cArr = (Array.isArray(event.clients_fk_id) ? event.clients_fk_id : [event.clients_fk_id]).filter(Boolean);
            if (cArr.length > 0) obj_fk.push({ clients: cArr });
        }

        return {
            db, table: 'vehicles',
            attribute: {
                license_plate: event.license_plate || '',
                brand: event.brand || '',
                model: event.model || '',
                year: event.year || '',
                color: event.color || '',
                mileage: event.mileage || '',
                vehicle_type: event.vehicle_type || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.clients_fk_id || (Array.isArray(event.clients_fk_id) && event.clients_fk_id.length === 0)) {
            let cId = event.owner_tax_id ? await resolveId('clients', 'tax_id', event.owner_tax_id, event, h) : null;
            if (!cId && event.tax_id) {
                cId = await resolveId('clients', 'tax_id', event.tax_id, event, h);
            }
            if (!cId && (event.owner_name || event.client_name)) {
                cId = await resolveId('clients', 'client_name', event.owner_name || event.client_name, event, h);
            }
            if (cId) {
                event.clients_fk_id = [cId];
                if (event.license_plate) {
                    fkCache[`vehicle_to_client:${String(event.license_plate).trim().toUpperCase()}`] = cId;
                }
            }
        }
        let payload = GestionTallerProdVehicles.build_payload(event);
        const res = await storeWithDeduplication('vehicles', payload, 'license_plate', event.license_plate, event, h);
        if (res?.id && event.license_plate) {
            fkCache[`vehicles:license_plate:${String(event.license_plate).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('vehicles', id, GestionTallerProdVehicles.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('vehicles', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('vehicles', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('vehicles', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('vehicles', event);
    }
}
