import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';

export class GestionTallerProdBodyShopMaterials {
    static table = 'body_shop_materials';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];

        return {
            db, table: 'body_shop_materials',
            attribute: {
                piece_name: event.piece_name || '',
                material_usage_qty: event.material_usage_qty || '',
                labor_cost: event.labor_cost || '',
                paint_amount: event.paint_amount || '',
                hardener: event.hardener || '',
                filler: event.filler || '',
                reducer: event.reducer || '',
                sandpaper: event.sandpaper || '',
                protective_paper: event.protective_paper || '',
                wire: event.wire || '',
                bodywork: event.bodywork || '',
                material_cost: event.material_cost || '',
                paint_price: event.paint_price || '',
                hardener_price: event.hardener_price || '',
                filler_price: event.filler_price || '',
                reducer_price: event.reducer_price || '',
                sandpaper_price: event.sandpaper_price || '',
                paper_price: event.paper_price || '',
                wire_price: event.wire_price || '',
                bodywork_price: event.bodywork_price || '',
                total_cost_per_piece: event.total_cost_per_piece || '',
                labor_and_cost_profit: event.labor_and_cost_profit || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        let payload = GestionTallerProdBodyShopMaterials.build_payload(event);
        return storeWithDeduplication('body_shop_materials', payload, 'piece_name', event.piece_name, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('body_shop_materials', id, GestionTallerProdBodyShopMaterials.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('body_shop_materials', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('body_shop_materials', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('body_shop_materials', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('body_shop_materials', event);
    }
}
