import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache } from '../helpers/fk_cache';

export class GestionTallerProdSuppliers {
    static table = 'suppliers';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'suppliers',
            attribute: {
                supplier_name: event.supplier_name || '',
                contact_person: event.contact_person || '',
                address: event.address || '',
                cell_phone: event.cell_phone || '',
                office_phone: event.office_phone || '',
                email: event.email || '',
                distributes_parts: event.distributes_parts || '',
                transport: event.transport || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdSuppliers.build_payload(event);
        const res = await storeWithDeduplication('suppliers', payload, 'supplier_name', event.supplier_name, event, h);
        if (res?.id && event.supplier_name) {
            fkCache[`suppliers:supplier_name:${String(event.supplier_name).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('suppliers', id, GestionTallerProdSuppliers.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('suppliers', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('suppliers', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('suppliers', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('suppliers', event);
    }
}
