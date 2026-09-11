import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdAccountsReceivable {
    static table = 'accounts_receivable';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.clients_fk_id) {
            const cArr = (Array.isArray(event.clients_fk_id) ? event.clients_fk_id : [event.clients_fk_id]).filter(Boolean);
            if (cArr.length > 0) obj_fk.push({ clients: cArr });
        }

        return {
            db, table: 'accounts_receivable',
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
        if (!event.clients_fk_id || (Array.isArray(event.clients_fk_id) && event.clients_fk_id.length === 0)) {
            let cId = event.tax_id ? await resolveId('clients', 'tax_id', event.tax_id, event, h) : null;
            if (!cId && event.client_name) {
                cId = await resolveId('clients', 'client_name', event.client_name, event, h);
            }
            if (cId) event.clients_fk_id = [cId];
        }
        let payload = GestionTallerProdAccountsReceivable.build_payload(event);
        return storeWithDeduplication('accounts_receivable', payload, 'description', event.description, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('accounts_receivable', id, GestionTallerProdAccountsReceivable.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('accounts_receivable', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('accounts_receivable', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('accounts_receivable', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('accounts_receivable', event);
    }
}
