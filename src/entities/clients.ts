import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache } from '../helpers/fk_cache';

export class GestionTallerProdClients {
    static table = 'clients';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'clients',
            attribute: {
                client_name: event.client_name || '',
                tax_id: event.tax_id || '',
                cell_phone: event.cell_phone || '',
                home_phone: event.home_phone || '',
                email: event.email || '',
                address: event.address || '',
                registration_date: event.registration_date || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdClients.build_payload(event);
        const res = await storeWithDeduplication('clients', payload, event.tax_id ? 'tax_id' : 'client_name', event.tax_id || event.client_name, event, h);
        if (res?.id) {
            if (event.tax_id) fkCache[`clients:tax_id:${String(event.tax_id).trim().toUpperCase()}`] = res.id;
            if (event.client_name) fkCache[`clients:client_name:${String(event.client_name).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }


    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('clients', id, GestionTallerProdClients.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('clients', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('clients', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('clients', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('clients', event);
    }
}
