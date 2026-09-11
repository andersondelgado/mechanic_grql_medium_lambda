import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdWorkContracts {
    static table = 'work_contracts';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.employees_fk_id) {
            const eArr = (Array.isArray(event.employees_fk_id) ? event.employees_fk_id : [event.employees_fk_id]).filter(Boolean);
            if (eArr.length > 0) obj_fk.push({ employees: eArr });
        }

        return {
            db, table: 'work_contracts',
            attribute: {
                issue_date: event.issue_date || '',
                reason: event.reason || '',
                destination: event.destination || '',
                notes: event.notes || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.employees_fk_id || (Array.isArray(event.employees_fk_id) && event.employees_fk_id.length === 0)) {
            let eId = event.tax_id ? await resolveId('employees', 'tax_id', event.tax_id, event, h) : null;
            if (!eId && event.employee_name) {
                eId = await resolveId('employees', 'employee_name', event.employee_name, event, h);
            }
            if (eId) event.employees_fk_id = [eId];
        }
        let payload = GestionTallerProdWorkContracts.build_payload(event);
        return storeWithDeduplication('work_contracts', payload, 'reason', event.reason, event, h);
    }


    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('work_contracts', id, GestionTallerProdWorkContracts.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('work_contracts', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('work_contracts', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('work_contracts', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('work_contracts', event);
    }
}
