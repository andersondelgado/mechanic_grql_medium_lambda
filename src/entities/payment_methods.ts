import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';

export interface PaymentMethodItem {
    id: string;
    country: string; // 'VE' | 'CO' | 'US' | 'ES' | 'GLOBAL'
    type: string; // 'pago_movil' | 'zelle' | 'divisa' | 'usdt' | 'transferencia' | 'nequi' | 'bizum'
    title: string;
    currency: string; // 'VES' | 'USD' | 'EUR' | 'COP' | 'USDT'
    bank_name?: string;
    phone?: string;
    tax_id?: string; // Cédula o RIF / NIT / SSN
    beneficiary?: string; // Nombre del titular
    account_number?: string;
    email?: string; // Para Zelle o Binance
    binance_id?: string; // Binance Pay ID
    wallet_address?: string; // Dirección USDT
    network?: string; // TRC20, BEP20, ERC20
    instructions?: string;
    is_active: boolean;
    qr_code_url?: string;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
    // 🇻🇪 VENEZUELA
    {
        id: 'pm-ve-pago-movil',
        country: 'VE',
        type: 'pago_movil',
        title: 'Pago Móvil (Interbancario)',
        currency: 'VES',
        bank_name: '0102 - Banco de Venezuela',
        phone: '0414-1234567',
        tax_id: 'J-50123456-7',
        beneficiary: 'Taller Mecánico 360 C.A.',
        instructions: 'Realizar el pago móvil a tasa oficial del día. Enviar captura con número de referencia bancaria.',
        is_active: true
    },
    {
        id: 'pm-ve-pago-movil-banesco',
        country: 'VE',
        type: 'pago_movil',
        title: 'Pago Móvil Banesco',
        currency: 'VES',
        bank_name: '0134 - Banesco Banco Universal',
        phone: '0424-9876543',
        tax_id: 'J-50123456-7',
        beneficiary: 'Taller Mecánico 360 C.A.',
        instructions: 'Confirmación inmediata. Enviar comprobante al WhatsApp del taller.',
        is_active: true
    },
    {
        id: 'pm-ve-efectivo-divisa',
        country: 'VE',
        type: 'divisa',
        title: 'Divisa en Efectivo (USD / EUR)',
        currency: 'USD',
        beneficiary: 'Caja Principal - Taller 360',
        instructions: 'Pago presencial en caja del taller. Billetes en buen estado, sin roturas ni marcas pronunciadas.',
        is_active: true
    },
    {
        id: 'pm-ve-zelle',
        country: 'VE',
        type: 'zelle',
        title: 'Zelle (Dólares USD)',
        currency: 'USD',
        email: 'pagos.taller360@gmail.com',
        beneficiary: 'Taller 360 LLC',
        instructions: 'Colocar únicamente el número de orden o presupuesto en el memo/concepto. No colocar palabras como factura o mecánico.',
        is_active: true
    },
    {
        id: 'pm-ve-usdt-binance',
        country: 'VE',
        type: 'usdt',
        title: 'USDT (Binance Pay / Crypto)',
        currency: 'USDT',
        binance_id: '284910283',
        email: 'binance@taller360.com',
        network: 'Tron (TRC-20) / BSC (BEP-20)',
        wallet_address: 'TQrL7YF45dM2qN9c8Pz1V8kJ6xR2mP7tWv',
        instructions: 'Pagos por Binance Pay son instantáneos y sin comisión. Si envía por red externa verificar la red seleccionada.',
        is_active: true
    },
    {
        id: 'pm-ve-transferencia-bs',
        country: 'VE',
        type: 'transferencia',
        title: 'Transferencia Bancaria en Bolívares (VES)',
        currency: 'VES',
        bank_name: '0102 - Banco de Venezuela',
        account_number: '0102-0123-45-0000123456',
        tax_id: 'J-50123456-7',
        beneficiary: 'Taller Mecánico 360 C.A.',
        instructions: 'Cuenta corriente jurídica. Adjuntar comprobante PDF o captura legible.',
        is_active: true
    },

    // 🇺🇸 ESTADOS UNIDOS / INTERNACIONAL
    {
        id: 'pm-us-zelle',
        country: 'US',
        type: 'zelle',
        title: 'Zelle Direct Pay (USD)',
        currency: 'USD',
        email: 'billing@taller360garage.com',
        phone: '+1 (786) 555-0199',
        beneficiary: 'Taller 360 Garage LLC',
        instructions: 'Direct instant payment via US banking app. Enter vehicle license plate in memo.',
        is_active: true
    },
    {
        id: 'pm-us-ach',
        country: 'US',
        type: 'transferencia',
        title: 'Wire / ACH Direct Deposit',
        currency: 'USD',
        bank_name: 'Chase Bank / Bank of America',
        account_number: '9876543210',
        beneficiary: 'Taller 360 Garage LLC',
        instructions: 'Routing (ABA): 021000021. For domestic ACH or wire transfers.',
        is_active: true
    },
    {
        id: 'pm-us-cash',
        country: 'US',
        type: 'divisa',
        title: 'Cash USD (In-Shop)',
        currency: 'USD',
        beneficiary: 'Cashier Desk',
        instructions: 'Pay at physical workshop reception desk.',
        is_active: true
    },

    // 🇨🇴 COLOMBIA
    {
        id: 'pm-co-nequi',
        country: 'CO',
        type: 'nequi',
        title: 'Nequi / Daviplata',
        currency: 'COP',
        phone: '310-555-0144',
        tax_id: 'CC 1020304050',
        beneficiary: 'Taller 360 Colombia SAS',
        instructions: 'Transferencias desde Nequi o Daviplata. Enviar comprobante con fecha y hora.',
        is_active: true
    },
    {
        id: 'pm-co-bancolombia',
        country: 'CO',
        type: 'transferencia',
        title: 'Bancolombia (Ahorros / Corriente)',
        currency: 'COP',
        bank_name: 'Bancolombia',
        account_number: '123-456789-01 (Ahorros)',
        tax_id: 'NIT 901.234.567-8',
        beneficiary: 'Taller 360 Colombia SAS',
        instructions: 'Transferencia directa o código QR Bancolombia.',
        is_active: true
    },
    {
        id: 'pm-co-efectivo',
        country: 'CO',
        type: 'divisa',
        title: 'Efectivo en Pesos (COP)',
        currency: 'COP',
        beneficiary: 'Caja Taller',
        instructions: 'Pago en caja del taller.',
        is_active: true
    },

    // 🇪🇸 ESPAÑA / EUROPA
    {
        id: 'pm-es-bizum',
        country: 'ES',
        type: 'bizum',
        title: 'Bizum',
        currency: 'EUR',
        phone: '+34 612 345 678',
        beneficiary: 'Taller 360 Automoción SL',
        instructions: 'Envío instantáneo mediante Bizum. Indicar matrícula en el concepto.',
        is_active: true
    },
    {
        id: 'pm-es-sepa',
        country: 'ES',
        type: 'transferencia',
        title: 'Transferencia SEPA (IBAN)',
        currency: 'EUR',
        bank_name: 'CaixaBank / BBVA',
        account_number: 'ES91 2100 0418 4502 0005 1234',
        beneficiary: 'Taller 360 Automoción SL',
        instructions: 'Transferencia bancaria europea SEPA en Euros.',
        is_active: true
    },

    // 🌐 GLOBAL / CRIPTO
    {
        id: 'pm-global-binance-usdt',
        country: 'GLOBAL',
        type: 'usdt',
        title: 'Binance Pay / USDT Global',
        currency: 'USDT',
        binance_id: '284910283',
        network: 'Tron (TRC-20)',
        wallet_address: 'TQrL7YF45dM2qN9c8Pz1V8kJ6xR2mP7tWv',
        instructions: 'Aceptamos USDT para clientes internacionales. Red TRC20 o Binance Pay ID.',
        is_active: true
    }
];

export class GestionTallerProdPaymentMethods {
    static table = 'catalogState';
    static catalogName = 'payment_methods';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        return {
            db,
            table: 'catalogState',
            attribute: {
                name: GestionTallerProdPaymentMethods.catalogName,
                metadata: event.metadata || event.methods || DEFAULT_PAYMENT_METHODS
            },
            obj_fk: []
        };
    }

    /**
     * Obtiene los métodos de pago. Si no existen en DB, devuelve los defaults y los inicializa.
     */
    static async get_methods(helpers?: BaseEntityHelpers, event?: any): Promise<PaymentMethodItem[]> {
        const h = helpers || baseEntityHelpers;
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdPaymentMethods.catalogName },
                headerLambda: event?.headerLambda,
                headerLambdaObject: event?.headerLambdaObject
            });

            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0 && Array.isArray(items[0]?.metadata) && items[0].metadata.length > 0) {
                return items[0].metadata as PaymentMethodItem[];
            }

            // Si está vacío, guardar los defaults y devolverlos
            const payload = GestionTallerProdPaymentMethods.build_payload({ metadata: DEFAULT_PAYMENT_METHODS });
            await h.store('catalogState', payload);
            return DEFAULT_PAYMENT_METHODS;
        } catch {
            return DEFAULT_PAYMENT_METHODS;
        }
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods: PaymentMethodItem[] = await GestionTallerProdPaymentMethods.get_methods(h, event);

        // Si el evento trae un solo método nuevo
        if (event.id || event.type || event.title) {
            const newMethod: PaymentMethodItem = {
                id: event.id || `pm-${Date.now()}`,
                country: event.country || 'VE',
                type: event.type || 'pago_movil',
                title: event.title || 'Nuevo Método de Pago',
                currency: event.currency || 'VES',
                bank_name: event.bank_name || '',
                phone: event.phone || '',
                tax_id: event.tax_id || '',
                beneficiary: event.beneficiary || '',
                account_number: event.account_number || '',
                email: event.email || '',
                binance_id: event.binance_id || '',
                wallet_address: event.wallet_address || '',
                network: event.network || '',
                instructions: event.instructions || '',
                is_active: event.is_active !== undefined ? event.is_active : true,
                qr_code_url: event.qr_code_url || ''
            };

            const existingIndex = methods.findIndex(m => m.id === newMethod.id);
            if (existingIndex >= 0) {
                methods[existingIndex] = { ...methods[existingIndex], ...newMethod };
            } else {
                methods.push(newMethod);
            }
        } else if (Array.isArray(event.metadata)) {
            // Reemplazo completo de la lista
            methods.length = 0;
            methods.push(...event.metadata);
        }

        const payload = GestionTallerProdPaymentMethods.build_payload({ metadata: methods });

        // Upsert en catalogState
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdPaymentMethods.catalogName },
                headerLambda: event.headerLambda,
                headerLambdaObject: event.headerLambdaObject
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0) {
                const primary = items[0];
                await h.update('catalogState', primary.id, payload);
                return { success: true, count: methods.length, data: methods };
            }
        } catch { }

        const res = await h.store('catalogState', payload);
        return { success: true, count: methods.length, data: methods, id: res?.id };
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);
        const index = methods.findIndex(m => m.id === id);

        if (index >= 0) {
            methods[index] = { ...methods[index], ...event };
        } else {
            methods.push({ id, ...event });
        }

        const payload = GestionTallerProdPaymentMethods.build_payload({ metadata: methods });
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdPaymentMethods.catalogName }
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0) {
                await h.update('catalogState', items[0].id, payload);
            }
        } catch { }

        return { success: true, updated: id, data: methods };
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);
        const updatedMethods = methods.filter(m => m.id !== id);

        const payload = GestionTallerProdPaymentMethods.build_payload({ metadata: updatedMethods });
        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdPaymentMethods.catalogName }
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            if (items && items.length > 0) {
                await h.update('catalogState', items[0].id, payload);
            }
        } catch { }

        return { success: true, deleted: id, count: updatedMethods.length };
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);

        let filtered = [...methods];
        const country = event.country || event.filter?.country;
        const type = event.type || event.filter?.type;
        const onlyActive = event.active !== undefined ? event.active : event.filter?.is_active;

        if (country) {
            filtered = filtered.filter(m => m.country.toLowerCase() === String(country).toLowerCase() || m.country === 'GLOBAL');
        }
        if (type) {
            filtered = filtered.filter(m => m.type.toLowerCase() === String(type).toLowerCase());
        }
        if (onlyActive !== undefined) {
            filtered = filtered.filter(m => m.is_active === (onlyActive === true || onlyActive === 'true'));
        }

        return { content: filtered, total: filtered.length };
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);
        return {
            content: methods,
            page: 1,
            size: methods.length,
            total: methods.length
        };
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);
        return { count: methods.length };
    }

    /**
     * Detección dinámica de métodos por geolocalización (lat/lon) y verificación de tasa configurada
     */
    static async custom_function(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const methods = await GestionTallerProdPaymentMethods.get_methods(h, event);

        // Importación dinámica de Currencies para validar tasa
        const { GestionTallerProdCurrencies } = await import('./currencies');
        const currencies = await GestionTallerProdCurrencies.get_currencies(h, event);

        let country = (event.country || '').toUpperCase();
        if (!country && event.latitude !== undefined && event.longitude !== undefined) {
            const detected = GestionTallerProdCurrencies.detect_country_by_coordinates(
                parseFloat(event.latitude),
                parseFloat(event.longitude)
            );
            country = detected.country;
        }

        if (!country) country = 'VE'; // Por defecto Venezuela

        // Mapeo país -> moneda local principal
        const countryCurrencyMap: Record<string, string> = {
            'VE': 'VES',
            'CO': 'COP',
            'US': 'USD',
            'ES': 'EUR',
            'GLOBAL': 'USDT'
        };

        const targetCurrencyCode = countryCurrencyMap[country] || 'USD';
        const targetCurrency = currencies.find(c => c.code === targetCurrencyCode);
        const isRateConfigured = targetCurrency ? (targetCurrency.rate > 0) : false;

        // Filtrar métodos de ese país + globales
        const countryMethods = methods.filter(m => m.country === country || m.country === 'GLOBAL');

        // Solo incluir métodos en moneda local si el negocio tiene la tasa configurada (> 0)
        const availableMethods = countryMethods.filter(m => {
            if (!m.is_active) return false;
            // Si la moneda del método es la local del país y no tiene tasa configurada en el taller
            if (m.currency === targetCurrencyCode && !isRateConfigured) {
                return false;
            }
            return true;
        });

        return {
            success: true,
            detected_country: country,
            currency: targetCurrencyCode,
            rate: targetCurrency?.rate ?? 0,
            is_rate_configured: isRateConfigured,
            methods: availableMethods,
            all_country_methods: countryMethods
        };
    }
}

