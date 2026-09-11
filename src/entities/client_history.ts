import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdClientHistory {
    static table = 'client_history';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        const vehId = Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id[0] : (event.vehicles_fk_id || '');
        const empId = Array.isArray(event.employees_fk_id) ? event.employees_fk_id[0] : (event.employees_fk_id || '');

        if (event.vehicles_fk_id) {
            const vArr = (Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id : [event.vehicles_fk_id]).filter(Boolean);
            if (vArr.length > 0) obj_fk.push({ vehicles: vArr });
        }
        if (event.employees_fk_id) {
            const eArr = (Array.isArray(event.employees_fk_id) ? event.employees_fk_id : [event.employees_fk_id]).filter(Boolean);
            if (eArr.length > 0) obj_fk.push({ employees: eArr });
        }

        return {
            db, table: 'client_history',
            attribute: {
                vehicles_fk_id: vehId,
                employees_fk_id: empId,
                service_date: event.service_date || '',
                work_performed: event.work_performed || '',
                assigned_mechanic: event.assigned_mechanic || '',
                time_in_shop: event.time_in_shop || '',
                observations: event.observations || '',
                total_cost: Number(event.total_cost) || 0,
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.vehicles_fk_id || (Array.isArray(event.vehicles_fk_id) && event.vehicles_fk_id.length === 0)) {
            if (event.license_plate) {
                const vId = await resolveId('vehicles', 'license_plate', event.license_plate, event, h);
                if (vId) event.vehicles_fk_id = [vId];
            }
        }
        if (!event.employees_fk_id || (Array.isArray(event.employees_fk_id) && event.employees_fk_id.length === 0)) {
            if (event.assigned_mechanic) {
                const eId = await resolveId('employees', 'employee_name', event.assigned_mechanic, event, h);
                if (eId) event.employees_fk_id = [eId];
            }
        }
        let payload = GestionTallerProdClientHistory.build_payload(event);
        return storeWithDeduplication('client_history', payload, 'work_performed', event.work_performed, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('client_history', id, GestionTallerProdClientHistory.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('client_history', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('client_history', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('client_history', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('client_history', event);
    }
}
