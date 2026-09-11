import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';


export class GestionTallerProdCatalogState {
    static table = 'catalogState';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        return {
            db,
            table: GestionTallerProdCatalogState.table,
            attribute: {
                name: event.name || '',
                metadata: event.metadata || []
            },
            obj_fk: []
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const payload = GestionTallerProdCatalogState.build_payload(event);
        const catalogName = event.name || event.attribute?.name || '';

        if (catalogName) {
            try {
                const existing = await h.data_filter('catalogState', {
                    filter: { field: 'name', value: catalogName },
                    headerLambda: event.headerLambda,
                    headerLambdaObject: event.headerLambdaObject
                });
                const items = existing?.content || (Array.isArray(existing) ? existing : []);
                if (items && items.length > 0) {
                    const primaryRecord = items[0];
                    // Clean up extra duplicate records
                    for (let i = 1; i < items.length; i++) {
                        if (items[i]?.id) {
                            try { await h.delete('catalogState', items[i].id, event); } catch { }
                        }
                    }
                    // Update the primary record with the latest metadata
                    const updateRes = await h.update('catalogState', primaryRecord.id, payload);
                    return updateRes?.id ? updateRes : { ...payload.attribute, id: primaryRecord.id, updated: true };
                }
            } catch {
                // Fallback to store if search fails
            }
        }

        return h.store('catalogState', payload);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('catalogState', id, GestionTallerProdCatalogState.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('catalogState', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('catalogState', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('catalogState', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('catalogState', event);
    }

    static async custom_function(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        try {
            let bulkStore = event.bulkStore || [];
            let response = [];
            for (let i = 0; i < bulkStore.length; i++) {
                let item = bulkStore[i];
                let storeItem = await h.store('catalogState', GestionTallerProdCatalogState.build_payload(item));
                response.push(storeItem);
            }
            return { success: true, data: response };
        } catch (error: any) {
            return {
                error: {
                    message: error?.message,
                    stack: error?.stack
                }
            };
        }
    }
}
