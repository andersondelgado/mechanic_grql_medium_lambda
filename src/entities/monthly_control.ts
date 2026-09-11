import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';

export class GestionTallerProdMonthlyControl {

    static table = 'monthly_control';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'monthly_control',
            attribute: {
                month: event.month || '',
                transaction_date: event.transaction_date || '',
                description: event.description || '',
                minor_rep_income: event.minor_rep_income || 0,
                major_rep_income: event.major_rep_income || 0,
                other_income: event.other_income || 0,
                salary_expense: event.salary_expense || 0,
                rent_expense: event.rent_expense || 0,
                supplies_expense: event.supplies_expense || '',
                tools_equipment_expense: event.tools_equipment_expense || '',
                other_expenses: event.other_expenses || 0,
                total_expenses: event.total_expenses || 0,
                total_amount: event.total_amount || 0,
                exchange_rate: event.exchange_rate || 0,
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdMonthlyControl.build_payload(event);
        return storeWithDeduplication('monthly_control', payload, 'description', event.description, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('monthly_control', id, GestionTallerProdMonthlyControl.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('monthly_control', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('monthly_control', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('monthly_control', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('monthly_control', event);
    }
}
