import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';

export interface CurrencyItem {
    code: string; // 'USD' | 'VES' | 'EUR' | 'COP' | 'USDT'
    name: string;
    symbol: string;
    rate: number; // Tasa respecto a 1 USD (ej: 1 USD = 50.0 VES, 1 USD = 0.92 EUR, 1 USD = 4150 COP, 1 USD = 1 USDT)
    is_base: boolean;
    decimals: number;
    flag: string;
    countries: string[];
    last_updated?: string;
}

export interface RateHistoryEntry {
    id: string;
    date: string; // YYYY-MM-DD
    currency_code: string; // 'VES' | 'COP' | 'EUR' | 'USDT'
    rate: number;
    source: string; // 'bcv_oficial' | 'paralelo' | 'trm' | 'manual_taller' | 'sistema'
    notes?: string;
    timestamp: string; // ISO string
}

export const DEFAULT_CURRENCIES: CurrencyItem[] = [
    {
        code: 'USD',
        name: 'Dólar Estadounidense',
        symbol: '$',
        rate: 1.0,
        is_base: true,
        decimals: 2,
        flag: '🇺🇸',
        countries: ['US', 'VE', 'PA', 'EC', 'GLOBAL'],
        last_updated: new Date().toISOString()
    },
    {
        code: 'VES',
        name: 'Bolívar Digital (Venezuela)',
        symbol: 'Bs.',
        rate: 50.0,
        is_base: false,
        decimals: 2,
        flag: '🇻🇪',
        countries: ['VE'],
        last_updated: new Date().toISOString()
    },
    {
        code: 'EUR',
        name: 'Euro (Unión Europea)',
        symbol: '€',
        rate: 0.92,
        is_base: false,
        decimals: 2,
        flag: '🇪🇺',
        countries: ['ES', 'EU'],
        last_updated: new Date().toISOString()
    },
    {
        code: 'COP',
        name: 'Peso Colombiano',
        symbol: 'COP$',
        rate: 4150.0,
        is_base: false,
        decimals: 0,
        flag: '🇨🇴',
        countries: ['CO'],
        last_updated: new Date().toISOString()
    },
    {
        code: 'USDT',
        name: 'Tether USD (Binance / Crypto)',
        symbol: 'USDT',
        rate: 1.0,
        is_base: false,
        decimals: 2,
        flag: '🟡',
        countries: ['GLOBAL', 'VE', 'US', 'CO', 'ES'],
        last_updated: new Date().toISOString()
    }
];

export class GestionTallerProdCurrencies {
    static table = 'catalogState';
    static catalogName = 'currency_settings';
    static historyCatalogName = 'exchange_rate_history';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        return {
            db,
            table: 'catalogState',
            attribute: {
                name: GestionTallerProdCurrencies.catalogName,
                metadata: event.metadata || event.currencies || DEFAULT_CURRENCIES
            },
            obj_fk: []
        };
    }

    /**
     * Obtiene las monedas y tasas activas configuradas en el negocio
     */
    static async get_currencies(helpers?: BaseEntityHelpers, event?: any): Promise<CurrencyItem[]> {
        const h = helpers || baseEntityHelpers;
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCurrencies.catalogName },
                headerLambda: event?.headerLambda,
                headerLambdaObject: event?.headerLambdaObject
            });

            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0 && Array.isArray(items[0]?.metadata) && items[0].metadata.length > 0) {
                return items[0].metadata as CurrencyItem[];
            }

            const payload = GestionTallerProdCurrencies.build_payload({ metadata: DEFAULT_CURRENCIES });
            await h.store('catalogState', payload);
            return DEFAULT_CURRENCIES;
        } catch {
            return DEFAULT_CURRENCIES;
        }
    }

    /**
     * Obtiene el histórico de tasas de cambio
     */
    static async get_rate_history(helpers?: BaseEntityHelpers, currencyCode?: string): Promise<RateHistoryEntry[]> {
        const h = helpers || baseEntityHelpers;
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCurrencies.historyCatalogName }
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0 && Array.isArray(items[0]?.metadata)) {
                let history = items[0].metadata as RateHistoryEntry[];
                if (currencyCode) {
                    history = history.filter(h => h.currency_code.toUpperCase() === currencyCode.toUpperCase());
                }
                return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
            return [];
        } catch {
            return [];
        }
    }

    /**
     * Registra una tasa en el histórico
     */
    static async record_rate_history(
        currencyCode: string,
        rate: number,
        source: string = 'manual_taller',
        notes: string = '',
        helpers?: BaseEntityHelpers
    ): Promise<RateHistoryEntry> {
        const h = helpers || baseEntityHelpers;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        const newEntry: RateHistoryEntry = {
            id: `rate-${currencyCode.toLowerCase()}-${dateStr}-${Date.now()}`,
            date: dateStr,
            currency_code: currencyCode.toUpperCase(),
            rate,
            source,
            notes,
            timestamp: now.toISOString()
        };

        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCurrencies.historyCatalogName }
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            let history: RateHistoryEntry[] = [];

            if (items && items.length > 0 && Array.isArray(items[0]?.metadata)) {
                history = items[0].metadata as RateHistoryEntry[];
                // Si ya existe registro de esa moneda en la misma fecha, lo actualizamos o agregamos nuevo punto
                const existingIdx = history.findIndex(h => h.date === dateStr && h.currency_code === currencyCode.toUpperCase());
                if (existingIdx >= 0) {
                    history[existingIdx] = newEntry;
                } else {
                    history.unshift(newEntry);
                }

                // Mantener últimos 180 registros para optimizar tamaño
                if (history.length > 180) history = history.slice(0, 180);

                const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
                await h.update('catalogState', items[0].id, {
                    db: 'GestionTallerProd' + envSuffix,
                    table: 'catalogState',
                    attribute: {
                        name: GestionTallerProdCurrencies.historyCatalogName,
                        metadata: history
                    },
                    obj_fk: []
                });
            } else {
                history = [newEntry];
                const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
                await h.store('catalogState', {
                    db: 'GestionTallerProd' + envSuffix,
                    table: 'catalogState',
                    attribute: {
                        name: GestionTallerProdCurrencies.historyCatalogName,
                        metadata: history
                    },
                    obj_fk: []
                });
            }
        } catch { }

        return newEntry;
    }

    /**
     * Detección dinámica de país a partir de coordenadas GPS (latitud, longitud)
     */
    static detect_country_by_coordinates(lat: number, lon: number): { country: string; confidence: string } {
        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
            return { country: 'VE', confidence: 'default' };
        }

        // 1. Venezuela: lat [0.6, 12.5], lon [-73.5, -59.8]
        if (lat >= 0.6 && lat <= 12.5 && lon >= -73.5 && lon <= -59.8) {
            // Refinamiento en la frontera con Colombia (el occidente más allá de -72/-73 suele ser Colombia)
            if (lon < -72.5 && lat < 8.0) {
                return { country: 'CO', confidence: 'high' };
            }
            return { country: 'VE', confidence: 'high' };
        }

        // 2. Colombia: lat [-4.3, 12.5], lon [-79.1, -66.8]
        if (lat >= -4.3 && lat <= 12.5 && lon >= -79.1 && lon <= -66.8) {
            return { country: 'CO', confidence: 'high' };
        }

        // 3. Estados Unidos (Continental + Florida/Texas): lat [24.5, 49.5], lon [-125.0, -66.9]
        if (lat >= 24.5 && lat <= 49.5 && lon >= -125.0 && lon <= -66.9) {
            return { country: 'US', confidence: 'high' };
        }

        // 4. España / Europa Continental: lat [35.0, 44.0], lon [-9.5, 4.5]
        if (lat >= 35.0 && lat <= 44.0 && lon >= -9.5 && lon <= 4.5) {
            return { country: 'ES', confidence: 'high' };
        }

        return { country: 'GLOBAL', confidence: 'low' };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const currencies = await GestionTallerProdCurrencies.get_currencies(h, event);

        // Si viene actualización de tasa individual o lista
        if (event.code && event.rate !== undefined) {
            const parsedRate = parseFloat(event.rate);
            const idx = currencies.findIndex(c => c.code.toUpperCase() === event.code.toUpperCase());
            if (idx >= 0) {
                currencies[idx] = {
                    ...currencies[idx],
                    rate: parsedRate,
                    last_updated: new Date().toISOString(),
                    symbol: event.symbol || currencies[idx].symbol,
                    name: event.name || currencies[idx].name
                };
            } else {
                currencies.push({
                    code: event.code.toUpperCase(),
                    name: event.name || event.code,
                    symbol: event.symbol || event.code,
                    rate: parsedRate,
                    is_base: false,
                    decimals: event.decimals ?? 2,
                    flag: event.flag || '🌐',
                    countries: event.countries || ['GLOBAL'],
                    last_updated: new Date().toISOString()
                });
            }

            // Guardar automáticamente en el histórico
            await GestionTallerProdCurrencies.record_rate_history(
                event.code,
                parsedRate,
                event.source || 'actualizacion_taller',
                event.notes || 'Actualización manual de tasa',
                h
            );
        } else if (Array.isArray(event.metadata)) {
            currencies.length = 0;
            currencies.push(...event.metadata);
        }

        const payload = GestionTallerProdCurrencies.build_payload({ metadata: currencies });

        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCurrencies.catalogName }
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0) {
                await h.update('catalogState', items[0].id, payload);
                return { success: true, currencies };
            }
        } catch { }

        const res = await h.store('catalogState', payload);
        return { success: true, currencies, id: res?.id };
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        return GestionTallerProdCurrencies.store(event, helpers);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const currencies = await GestionTallerProdCurrencies.get_currencies(h, event);
        return { content: currencies, total: currencies.length };
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const currencies = await GestionTallerProdCurrencies.get_currencies(h, event);
        return { content: currencies, total: currencies.length, page: 1, size: currencies.length };
    }

    /**
     * Funciones especiales solicitadas:
     *  - get_daily_rate: Retorna la tasa del día actual y asegura su snapshot en el histórico
     *  - get_rate_history: Retorna el histórico de tasas guardadas
     *  - detect_country: Detecta el país según latitud y longitud
     *  - convert: Conversión monetaria inmediata
     */
    static async custom_function(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const currencies = await GestionTallerProdCurrencies.get_currencies(h, event);
        const action = event.action || event.method || '';

        // 1. Obtener la tasa del día y guardar snapshot en el histórico si no existe
        if (action === 'get_daily_rate' || action === 'tasa_del_dia') {
            const targetCode = (event.code || event.currency || 'VES').toUpperCase();
            const curr = currencies.find(c => c.code.toUpperCase() === targetCode) || currencies[0];
            const todayStr = new Date().toISOString().split('T')[0];

            // Registrar automáticamente el snapshot del día si la tasa está activa
            if (curr && curr.rate > 0) {
                await GestionTallerProdCurrencies.record_rate_history(
                    curr.code,
                    curr.rate,
                    'snapshot_diario',
                    `Tasa del día ${todayStr}`,
                    h
                );
            }

            return {
                success: true,
                date: todayStr,
                currency: curr.code,
                rate: curr.rate,
                symbol: curr.symbol,
                name: curr.name,
                is_configured: curr.rate > 0,
                currencies: currencies
            };
        }

        // 2. Obtener el histórico de tasas de cambio
        if (action === 'get_rate_history' || action === 'historico_tasas') {
            const currencyCode = event.code || event.currency;
            const history = await GestionTallerProdCurrencies.get_rate_history(h, currencyCode);
            return {
                success: true,
                total: history.length,
                history
            };
        }

        // 3. Detectar país por coordenadas (latitud, longitud)
        if (action === 'detect_country' || action === 'geolocalizacion') {
            const lat = parseFloat(event.latitude || event.lat);
            const lon = parseFloat(event.longitude || event.lon || event.lng);
            const detection = GestionTallerProdCurrencies.detect_country_by_coordinates(lat, lon);

            // Verificar si el negocio tiene configurada la tasa para la moneda de ese país
            const countryCurrencyMap: Record<string, string> = {
                'VE': 'VES',
                'CO': 'COP',
                'US': 'USD',
                'ES': 'EUR',
                'GLOBAL': 'USDT'
            };
            const targetCurrency = countryCurrencyMap[detection.country] || 'USD';
            const matchedCurrency = currencies.find(c => c.code === targetCurrency);
            const isRateConfigured = matchedCurrency ? matchedCurrency.rate > 0 : false;

            return {
                success: true,
                country: detection.country,
                confidence: detection.confidence,
                currency: targetCurrency,
                currency_rate: matchedCurrency?.rate ?? 0,
                is_rate_configured: isRateConfigured,
                coordinates: { latitude: lat, longitude: lon }
            };
        }

        // 4. Operación de conversión rápida: { action: 'convert', amount: 100, from: 'USD', to: 'VES' }
        if (action === 'convert') {
            const amount = parseFloat(event.amount || 0);
            const fromCode = (event.from || 'USD').toUpperCase();
            const toCode = (event.to || 'VES').toUpperCase();

            const fromCurr = currencies.find(c => c.code === fromCode) || { rate: 1.0 };
            const toCurr = currencies.find(c => c.code === toCode) || { rate: 1.0 };

            const amountInUSD = fromCurr.rate > 0 ? amount / fromCurr.rate : amount;
            const convertedAmount = amountInUSD * toCurr.rate;

            return {
                amount,
                from: fromCode,
                to: toCode,
                converted_amount: Math.round(convertedAmount * 100) / 100,
                rate_from: fromCurr.rate,
                rate_to: toCurr.rate
            };
        }

        return { currencies };
    }
}
