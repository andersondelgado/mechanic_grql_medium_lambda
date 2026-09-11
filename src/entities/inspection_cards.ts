import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdInspectionCards {
    static table = 'inspection_cards';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.vehicles_fk_id) {
            const vArr = (Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id : [event.vehicles_fk_id]).filter(Boolean);
            if (vArr.length > 0) obj_fk.push({ vehicles: vArr });
        }
        if (event.employees_fk_id) {
            const eArr = (Array.isArray(event.employees_fk_id) ? event.employees_fk_id : [event.employees_fk_id]).filter(Boolean);
            if (eArr.length > 0) obj_fk.push({ employees: eArr });
        }

        return {
            db, table: 'inspection_cards',
            attribute: {
                inspection_type: event.inspection_type || '',
                inspection_date: event.inspection_date || '',
                item_name: event.item_name || '',
                check_yes: event.check_yes || false,
                check_no: event.check_no || true,
                observations: event.observations || '',
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
            const empName = event.employee_name || event.inspector_name;
            if (empName) {
                const eId = await resolveId('employees', 'employee_name', empName, event, h);
                if (eId) event.employees_fk_id = [eId];
            }
        }
        let payload = GestionTallerProdInspectionCards.build_payload(event);
        return storeWithDeduplication('inspection_cards', payload, 'item_name', event.item_name, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('inspection_cards', id, GestionTallerProdInspectionCards.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('inspection_cards', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('inspection_cards', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('inspection_cards', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('inspection_cards', event);
    }
}
