import { BaseEntityHelpers } from 'skd-grql';

export const fkCache: Record<string, string> = {};

export function clearFkCache(): void {
    for (const key of Object.keys(fkCache)) {
        delete fkCache[key];
    }
}

export async function resolveId(
    table: string,
    field: string,
    value: any,
    event: any,
    helpers: BaseEntityHelpers
): Promise<string | null> {
    const val = String(value || '').trim();
    if (!val) return null;

    try {
        const res = await helpers.data_filter(table, {
            filter: { field, value: val },
            headerLambda: event?.headerLambda,
            headerLambdaObject: event?.headerLambdaObject
        });
        const items = res?.content || (Array.isArray(res) ? res : []);
        if (items && items.length > 0 && items[0]?.id) {
            return items[0].id;
        }
    } catch { }
    return null;
}
