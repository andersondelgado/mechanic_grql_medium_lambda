import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers } from '../config';

export type SupportedCountry = 'VE' | 'CO' | 'US' | 'ES' | 'GLOBAL';

export interface CompanySettings {
    commercialName: string;
    legalName: string;
    documentHeaderName: string;
    taxIdLabel: string;
    taxId: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    specialties: string;
    website: string;
    country: SupportedCountry;
    logoDataUrl?: string;
    legalClause: string;
    updatedAt?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
    commercialName: 'Taller Integral 360',
    legalName: 'Urbaez Motors 2030 C.A.',
    documentHeaderName: 'TALLER INTEGRAL 360 GARAGE C.A.',
    taxIdLabel: 'RIF',
    taxId: 'J-50123456-7',
    phone: '(0212) 555-0360',
    whatsapp: '+58 414-1234567',
    email: 'contacto@taller360.com',
    address: 'Caracas, Venezuela',
    specialties: 'Mecánica General • Latonería y Pintura • Diagnóstico Computarizado',
    website: 'www.taller360.com',
    country: 'VE',
    legalClause: 'El cliente autoriza los trabajos indicados y las pruebas de manejo correspondientes.'
};

/**
 * GestionTallerProdCompanySettings
 * Gestiona la configuración de identidad comercial y datos fiscales (Marca Blanca) del taller,
 * persistiendo en la tabla `catalogState` bajo `name = 'company_settings'`.
 */
export class GestionTallerProdCompanySettings {
    static table = 'catalogState';
    static CATALOG_NAME = 'company_settings';

    static getDbName(): string {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        return 'GestionTallerProd' + envSuffix;
    }

    static async get_settings(event: any = {}, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        try {
            const res = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCompanySettings.CATALOG_NAME },
                headerLambda: event?.headerLambda,
                headerLambdaObject: event?.headerLambdaObject
            });
            const items = res?.content || (Array.isArray(res) ? res : []);
            const record = items.find((i: any) => i.name === GestionTallerProdCompanySettings.CATALOG_NAME) || items[0];

            if (record && Array.isArray(record.metadata) && record.metadata.length > 0) {
                return {
                    success: true,
                    id: record.id,
                    data: {
                        ...DEFAULT_COMPANY_SETTINGS,
                        ...record.metadata[0]
                    }
                };
            }
        } catch { }

        return {
            success: true,
            data: DEFAULT_COMPANY_SETTINGS
        };
    }

    static async update_settings(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const db = GestionTallerProdCompanySettings.getDbName();

        const currentRes = await GestionTallerProdCompanySettings.get_settings(event, h);
        const currentSettings: CompanySettings = currentRes?.data || DEFAULT_COMPANY_SETTINGS;

        const incoming = Array.isArray(event.metadata) && event.metadata.length > 0
            ? event.metadata[0]
            : (event.settings || event.company || event);

        const updated: CompanySettings = {
            commercialName: incoming.commercialName ?? currentSettings.commercialName,
            legalName: incoming.legalName ?? currentSettings.legalName,
            documentHeaderName: incoming.documentHeaderName ?? currentSettings.documentHeaderName,
            taxIdLabel: incoming.taxIdLabel ?? currentSettings.taxIdLabel,
            taxId: incoming.taxId ?? currentSettings.taxId,
            phone: incoming.phone ?? currentSettings.phone,
            whatsapp: incoming.whatsapp ?? currentSettings.whatsapp,
            email: incoming.email ?? currentSettings.email,
            address: incoming.address ?? currentSettings.address,
            specialties: incoming.specialties ?? currentSettings.specialties,
            website: incoming.website ?? currentSettings.website,
            country: incoming.country ?? currentSettings.country,
            logoDataUrl: incoming.logoDataUrl ?? currentSettings.logoDataUrl,
            legalClause: incoming.legalClause ?? currentSettings.legalClause,
            updatedAt: new Date().toISOString()
        };

        const payload = {
            db,
            table: 'catalogState',
            attribute: {
                name: GestionTallerProdCompanySettings.CATALOG_NAME,
                metadata: [updated]
            },
            obj_fk: []
        };

        try {
            const existing = await h.data_filter('catalogState', {
                filter: { field: 'name', value: GestionTallerProdCompanySettings.CATALOG_NAME },
                headerLambda: event?.headerLambda,
                headerLambdaObject: event?.headerLambdaObject
            });
            const items = existing?.content || (Array.isArray(existing) ? existing : []);
            const found = items.find((i: any) => i.name === GestionTallerProdCompanySettings.CATALOG_NAME);

            if (found?.id) {
                await h.update('catalogState', found.id, payload);
                return { success: true, id: found.id, data: updated };
            }
        } catch { }

        const created = await h.store('catalogState', payload);
        return { success: true, id: created?.id, data: updated };
    }

    static async reset_settings(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        return GestionTallerProdCompanySettings.update_settings({
            ...event,
            settings: {
                ...DEFAULT_COMPANY_SETTINGS,
                updatedAt: new Date().toISOString()
            }
        }, helpers);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        return GestionTallerProdCompanySettings.get_settings(event, helpers);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        return GestionTallerProdCompanySettings.get_settings(event, helpers);
    }

    static async store(event: any, helpers?: BaseEntityHelpers, _sec?: MiddlewareSecurity): Promise<any> {
        return GestionTallerProdCompanySettings.update_settings(event, helpers);
    }

    static async update(_id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        return GestionTallerProdCompanySettings.update_settings(event, helpers);
    }

    static async custom_function(actionOrParams: any, event?: any, helpers?: BaseEntityHelpers): Promise<any> {
        let action = '';
        let payload: any = {};

        if (typeof actionOrParams === 'string') {
            action = actionOrParams;
            payload = event?.body || event || {};
        } else if (typeof actionOrParams === 'object' && actionOrParams !== null) {
            action = actionOrParams.action || actionOrParams.name || actionOrParams.params?.action || actionOrParams.body?.action || '';
            payload = actionOrParams.body || actionOrParams.params?.body || actionOrParams.params || actionOrParams;
        }

        if (action === 'update_settings' || action === 'save') {
            return GestionTallerProdCompanySettings.update_settings(payload, helpers);
        }
        if (action === 'reset_settings' || action === 'reset') {
            return GestionTallerProdCompanySettings.reset_settings(payload, helpers);
        }
        return GestionTallerProdCompanySettings.get_settings(payload, helpers);
    }
}

