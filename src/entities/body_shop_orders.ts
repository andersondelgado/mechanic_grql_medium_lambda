import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';

export class GestionTallerProdBodyShopOrders {
    static table = 'body_shop_orders';

    static async resolveFks(event: any, h: BaseEntityHelpers): Promise<void> {
        // 1. Resolve vehicles_fk_id if missing but license_plate is present
        if (!event.vehicles_fk_id || (Array.isArray(event.vehicles_fk_id) && event.vehicles_fk_id.length === 0)) {
            if (event.license_plate) {
                const vId = await resolveId('vehicles', 'license_plate', event.license_plate, event, h);
                if (vId) event.vehicles_fk_id = [vId];
            }
        }

        // 2. If vehicle is known, populate vehicle details and client if missing
        const vId = Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id[0] : event.vehicles_fk_id;
        if (vId) {
            try {
                const vRes = await h.data_filter('vehicles', {
                    filter: { field: 'id', value: String(vId).trim() },
                    headerLambda: event?.headerLambda,
                    headerLambdaObject: event?.headerLambdaObject
                });
                const vItems = vRes?.content || (Array.isArray(vRes) ? vRes : []);
                if (vItems.length > 0) {
                    const veh = vItems[0];
                    if (!event.license_plate && veh.license_plate) event.license_plate = veh.license_plate;
                    if (!event.brand && veh.brand) event.brand = veh.brand;
                    if (!event.model && veh.model) event.model = veh.model;
                    if (!event.color && veh.color) event.color = veh.color;
                    if ((!event.clients_fk_id || (Array.isArray(event.clients_fk_id) && event.clients_fk_id.length === 0)) && veh.clients_fk_id) {
                        const rawFk = veh.clients_fk_id;
                        const cFk = Array.isArray(rawFk) ? rawFk[0] : (typeof rawFk === 'object' ? rawFk.id : rawFk);
                        if (cFk) event.clients_fk_id = [cFk];
                    }
                }
            } catch { }
        }

        // 3. Resolve clients_fk_id if missing
        if (!event.clients_fk_id || (Array.isArray(event.clients_fk_id) && event.clients_fk_id.length === 0)) {
            let cId = event.tax_id ? await resolveId('clients', 'tax_id', event.tax_id, event, h) : null;
            if (!cId && event.client_name) {
                cId = await resolveId('clients', 'client_name', event.client_name, event, h);
            }
            if (cId) event.clients_fk_id = [cId];
        }

        // 4. If client is known, populate client_name and tax_id if missing
        const cId = Array.isArray(event.clients_fk_id) ? event.clients_fk_id[0] : event.clients_fk_id;
        if (cId) {
            try {
                const cRes = await h.data_filter('clients', {
                    filter: { field: 'id', value: String(cId).trim() },
                    headerLambda: event?.headerLambda,
                    headerLambdaObject: event?.headerLambdaObject
                });
                const cItems = cRes?.content || (Array.isArray(cRes) ? cRes : []);
                if (cItems.length > 0) {
                    const cli = cItems[0];
                    if (!event.client_name && cli.client_name) event.client_name = cli.client_name;
                    if (!event.tax_id && cli.tax_id) event.tax_id = cli.tax_id;
                }
            } catch { }
        }

        // 5. Resolve employees_fk_id if missing
        if (!event.employees_fk_id || (Array.isArray(event.employees_fk_id) && event.employees_fk_id.length === 0)) {
            if (event.assigned_mechanic) {
                const eId = await resolveId('employees', 'employee_name', event.assigned_mechanic, event, h);
                if (eId) event.employees_fk_id = [eId];
            }
        }
    }

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        const vArr = (Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id : [event.vehicles_fk_id]).filter(Boolean);
        if (vArr.length > 0) obj_fk.push({ vehicles: vArr });

        const cArr = (Array.isArray(event.clients_fk_id) ? event.clients_fk_id : [event.clients_fk_id]).filter(Boolean);
        if (cArr.length > 0) obj_fk.push({ clients: cArr });

        const eArr = (Array.isArray(event.employees_fk_id) ? event.employees_fk_id : [event.employees_fk_id]).filter(Boolean);
        if (eArr.length > 0) obj_fk.push({ employees: eArr });

        return {
            db, table: 'body_shop_orders',
            attribute: {
                order_number: event.order_number || '',
                order_date: event.order_date || event.entry_date || '',
                entry_date: event.entry_date || event.order_date || '',
                brand: event.brand || '',
                model: event.model || '',
                license_plate: event.license_plate || '',
                color: event.color || '',
                mileage: event.mileage || '',
                assigned_mechanic: event.assigned_mechanic || '',
                work_performed: event.work_performed || event.description || '',
                description: event.description || event.work_performed || '',
                total_cost: event.total_cost != null && event.total_cost !== '' ? Number(event.total_cost) : '',
                profit: event.profit != null && event.profit !== '' ? Number(event.profit) : '',
                status: event.status || 'pendiente',
                vehicles_fk_id: vArr[0] || '',
                clients_fk_id: cArr[0] || '',
                employees_fk_id: eArr[0] || '',
                client_name: event.client_name || '',
                tax_id: event.tax_id || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        await GestionTallerProdBodyShopOrders.resolveFks(event, h);
        let payload = GestionTallerProdBodyShopOrders.build_payload(event);
        return storeWithDeduplication('body_shop_orders', payload, 'order_number', event.order_number, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        await GestionTallerProdBodyShopOrders.resolveFks(event, h);
        return h.update('body_shop_orders', id, GestionTallerProdBodyShopOrders.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('body_shop_orders', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('body_shop_orders', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('body_shop_orders', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('body_shop_orders', event);
    }
}
