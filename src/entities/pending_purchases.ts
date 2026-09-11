import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdPendingPurchases {
    static table = 'pending_purchases';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.suppliers_fk_id) {
            const sArr = (Array.isArray(event.suppliers_fk_id) ? event.suppliers_fk_id : [event.suppliers_fk_id]).filter(Boolean);
            if (sArr.length > 0) obj_fk.push({ suppliers: sArr });
        }

        return {
            db, table: 'pending_purchases',
            attribute: {
                info_date: event.info_date || '',
                purchase_date: event.purchase_date || '',
                product_name: event.product_name || '',
                supplier_name: event.supplier_name || '',
                purchased: event.purchased || '',
                quantity: event.quantity || '',
                unit_price: event.unit_price || '',
                notes: event.notes || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.suppliers_fk_id || (Array.isArray(event.suppliers_fk_id) && event.suppliers_fk_id.length === 0)) {
            if (event.supplier_name) {
                const sId = await resolveId('suppliers', 'supplier_name', event.supplier_name, event, h);
                if (sId) event.suppliers_fk_id = [sId];
            }
        }
        let payload = GestionTallerProdPendingPurchases.build_payload(event);
        return storeWithDeduplication('pending_purchases', payload, 'product_name', event.product_name, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('pending_purchases', id, GestionTallerProdPendingPurchases.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('pending_purchases', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('pending_purchases', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('pending_purchases', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('pending_purchases', event);
    }
}
