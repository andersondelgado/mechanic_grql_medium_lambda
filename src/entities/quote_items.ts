import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdQuoteItems {
    static table = 'quote_items';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.quotes_fk_id) {
            const qArr = (Array.isArray(event.quotes_fk_id) ? event.quotes_fk_id : [event.quotes_fk_id]).filter(Boolean);
            if (qArr.length > 0) obj_fk.push({ quotes: qArr });
        }

        return {
            db, table: 'quote_items',
            attribute: {
                item_number: event.item_number || '',
                description: event.description || '',
                quantity: event.quantity || '',
                unit_price: event.unit_price || '',
                total_price: event.total_price || '',
                supplier_store: event.supplier_store || '',
                product_name: event.product_name || '',
                product_brand: event.product_brand || '',
                product_price: event.product_price || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.quotes_fk_id || (Array.isArray(event.quotes_fk_id) && event.quotes_fk_id.length === 0)) {
            let qNum = event.quote_number;
            if (!qNum && typeof event.description === 'string') {
                const m = event.description.match(/COT-\d+/i);
                if (m) qNum = m[0];
            }
            if (qNum) {
                const qId = await resolveId('quotes', 'quote_number', qNum, event, h);
                if (qId) event.quotes_fk_id = [qId];
            }
        }
        let payload = GestionTallerProdQuoteItems.build_payload(event);
        return storeWithDeduplication('quote_items', payload, 'description', event.description, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('quote_items', id, GestionTallerProdQuoteItems.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('quote_items', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('quote_items', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('quote_items', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('quote_items', event);
    }
}
