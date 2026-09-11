import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { fkCache } from '../helpers/fk_cache';

export class GestionTallerProdEmployees {
    static table = 'employees';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'employees',
            attribute: {
                employee_name: event.employee_name || '',
                tax_id: event.tax_id || '',
                phone: event.phone || '',
                address: event.address || '',
                hire_date: event.hire_date || '',
                employee_type: event.employee_type || '',
                salary: event.salary || '',
                email: event.email || '',
                contract_type: event.contract_type || '',
                position: event.position || '',
                is_mechanic: event.is_mechanic || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdEmployees.build_payload(event);
        const res = await storeWithDeduplication('employees', payload, event.tax_id ? 'tax_id' : 'employee_name', event.tax_id || event.employee_name, event, h);
        if (res?.id) {
            if (event.tax_id) fkCache[`employees:tax_id:${String(event.tax_id).trim().toUpperCase()}`] = res.id;
            if (event.employee_name) fkCache[`employees:employee_name:${String(event.employee_name).trim().toUpperCase()}`] = res.id;
        }
        return res;
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('employees', id, GestionTallerProdEmployees.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('employees', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('employees', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('employees', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('employees', event);
    }
}
