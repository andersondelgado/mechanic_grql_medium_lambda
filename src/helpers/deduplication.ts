import { BaseEntityHelpers } from 'skd-grql';

export async function storeWithDeduplication(
    table: string,
    payload: any,
    searchField: string,
    searchValue: any,
    event: any,
    helpers: BaseEntityHelpers
): Promise<any> {
    const val = String(searchValue || '').trim();
    if (val) {
        try {
            const existing = await helpers.data_filter(table, {
                filter: { field: searchField, value: val },
                headerLambda: event?.headerLambda,
                headerLambdaObject: event?.headerLambdaObject
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0) {
                const primaryRecord = items[0];
                for (let i = 1; i < items.length; i++) {
                    if (items[i]?.id) {
                        try { await helpers.delete(table, items[i].id, event); } catch { }
                    }
                }
                const updateRes = await helpers.update(table, primaryRecord.id, payload);
                return updateRes?.id ? updateRes : { ...payload.attribute, id: primaryRecord.id, updated: true };
            }
        } catch { }
    }
    return helpers.store(table, payload);
}
