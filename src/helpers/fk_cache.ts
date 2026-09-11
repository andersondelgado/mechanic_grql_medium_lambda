import { BaseEntityHelpers } from 'skd-grql';

export const fkCache: Record<string, string> = {};

export async function resolveId(
    table: string,
    field: string,
    value: any,
    event: any,
    helpers: BaseEntityHelpers
): Promise<string | null> {
    const val = String(value || '').trim();
    if (!val) return null;
    const cacheKey = `${table}:${field}:${val.toUpperCase()}`;
    if (fkCache[cacheKey]) return fkCache[cacheKey];

    try {
        const res = await helpers.data_filter(table, {
            filter: { field, value: val },
            headerLambda: event?.headerLambda,
            headerLambdaObject: event?.headerLambdaObject
        });
        const items = res?.content || (Array.isArray(res) ? res : []);
        if (items && items.length > 0 && items[0]?.id) {
            fkCache[cacheKey] = items[0].id;
            return items[0].id;
        }
    } catch { }
    return null;
}
