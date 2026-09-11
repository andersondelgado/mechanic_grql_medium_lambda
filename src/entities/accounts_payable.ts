import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdAccountsPayable {
    static table = 'accounts_payable';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.suppliers_fk_id) {
            const sArr = (Array.isArray(event.suppliers_fk_id) ? event.suppliers_fk_id : [event.suppliers_fk_id]).filter(Boolean);
            if (sArr.length > 0) obj_fk.push({ suppliers: sArr });
        }

        return {
            db, table: 'accounts_payable',
            attribute: {
                transaction_date: event.transaction_date || '',
                payment_date: event.payment_date || '',
                description: event.description || '',
                debit: event.debit || '',
                credit: event.credit || '',
                balance: event.balance || '',
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
        let payload = GestionTallerProdAccountsPayable.build_payload(event);
        return storeWithDeduplication('accounts_payable', payload, 'description', event.description, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('accounts_payable', id, GestionTallerProdAccountsPayable.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('accounts_payable', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('accounts_payable', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('accounts_payable', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('accounts_payable', event);
    }
}
