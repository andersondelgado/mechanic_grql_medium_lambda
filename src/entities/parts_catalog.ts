import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';

export class GestionTallerProdPartsCatalog {
    static table = 'parts_catalog';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'parts_catalog',
            attribute: {
                part_code: event.part_code || '',
                description: event.description || '',
                brand: event.brand || '',
                price_without_tax: event.price_without_tax || '',
                stock_main: event.stock_main || '',
                stock_caracas: event.stock_caracas || '',
                discount_1: event.discount_1 || '',
                discounted_price_1: event.discounted_price_1 || '',
                discount_2: event.discount_2 || '',
                final_discounted_price: event.final_discounted_price || '',
                final_discount: event.final_discount || '',
                price_by_rubro: event.price_by_rubro || '',
                bs_to_uro: event.bs_to_uro || '',
                category: event.category || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdPartsCatalog.build_payload(event);
        return storeWithDeduplication('parts_catalog', payload, 'part_code', event.part_code || event.code, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('parts_catalog', id, GestionTallerProdPartsCatalog.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('parts_catalog', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('parts_catalog', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('parts_catalog', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('parts_catalog', event);
    }
}
