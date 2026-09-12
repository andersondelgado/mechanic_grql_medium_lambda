import { BaseEntityHelpers, MiddlewareSecurity } from 'skd-grql';
import { DB_VAR, baseEntityHelpers, middlewareSecurity } from '../config';
import { storeWithDeduplication } from '../helpers/deduplication';
import { resolveId } from '../helpers/fk_cache';
import { ReceiptPdfService } from '../services/receipt_pdf.service';

export class GestionTallerProdVehicleReceipts {
    static table = 'vehicle_receipts';

    static build_payload(event: any): any {
        const envSuffix = DB_VAR.includes('-') ? '-' + DB_VAR.split('-')[1] : '';
        const db = 'GestionTallerProd' + envSuffix;

        const obj_fk: any[] = [];
        if (event.vehicles_fk_id) {
            const vArr = (Array.isArray(event.vehicles_fk_id) ? event.vehicles_fk_id : [event.vehicles_fk_id]).filter(Boolean);
            if (vArr.length > 0) obj_fk.push({ vehicles: vArr });
        }
        if (event.employees_fk_id) {
            const eArr = (Array.isArray(event.employees_fk_id) ? event.employees_fk_id : [event.employees_fk_id]).filter(Boolean);
            if (eArr.length > 0) obj_fk.push({ employees: eArr });
        }
        if (event.clients_fk_id) {
            const cArr = (Array.isArray(event.clients_fk_id) ? event.clients_fk_id : [event.clients_fk_id]).filter(Boolean);
            if (cArr.length > 0) obj_fk.push({ clients: cArr });
        }

        return {
            db, table: 'vehicle_receipts',
            attribute: {
                receipt_number: event.receipt_number || '',
                entry_date: event.entry_date || '',
                owner_name: event.owner_name || '',
                owner_tax_id: event.owner_tax_id || '',
                phone: event.phone || '',
                brand: event.brand || '',
                model: event.model || '',
                license_plate: event.license_plate || '',
                color: event.color || '',
                mileage: event.mileage || '',
                exit_date: event.exit_date || '',
                receiving_technician: event.receiving_technician || '',
                reception_service: event.reception_service || '',
                address: event.address || '',
                received_by: event.received_by || '',
                delivered_by: event.delivered_by || '',
                delivery_address: event.delivery_address || '',
                assigned_technician: event.assigned_technician || '',
                time_in_shop: event.time_in_shop || '',
                reason_for_entry: event.reason_for_entry || '',
                work_performed: event.work_performed || '',
                must_return: event.must_return || '',
                pending_issues: event.pending_issues || '',
                delivery_date: event.delivery_date || '',
                expected_return_date: event.expected_return_date || '',
                fuel_level: event.fuel_level || '',
                status: event.status || 'proceso',
                observations: event.observations || '',
                checklist_external: event.checklist_external ? (typeof event.checklist_external === 'string' ? event.checklist_external : JSON.stringify(event.checklist_external)) : '',
                checklist_internal: event.checklist_internal ? (typeof event.checklist_internal === 'string' ? event.checklist_internal : JSON.stringify(event.checklist_internal)) : '',
                damage_points: event.damage_points ? (typeof event.damage_points === 'string' ? event.damage_points : JSON.stringify(event.damage_points)) : '',
                authorized_services: event.authorized_services || '',
                client_signature: event.client_signature || event.signature_client || event.firma_cliente || event.clientSignature || '',
                mechanic_signature: event.mechanic_signature || event.signature_mechanic || event.firma_mecanico || event.firma_tecnico || event.mechanicSignature || '',
            },
            obj_fk
        };
    }

    static async store(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        if (!event.vehicles_fk_id || (Array.isArray(event.vehicles_fk_id) && event.vehicles_fk_id.length === 0)) {
            if (event.license_plate) {
                const vId = await resolveId('vehicles', 'license_plate', event.license_plate, event, h);
                if (vId) event.vehicles_fk_id = [vId];
            }
        }
        if (!event.employees_fk_id || (Array.isArray(event.employees_fk_id) && event.employees_fk_id.length === 0)) {
            const empName = event.assigned_technician || event.receiving_technician || event.received_by;
            if (empName) {
                const eId = await resolveId('employees', 'employee_name', empName, event, h);
                if (eId) event.employees_fk_id = [eId];
            }
        }
        let payload = GestionTallerProdVehicleReceipts.build_payload(event);
        return storeWithDeduplication('vehicle_receipts', payload, 'license_plate', event.license_plate, event, h);
    }

    static async update(id: string, event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.update('vehicle_receipts', id, GestionTallerProdVehicleReceipts.build_payload(event));
    }

    static async delete(event: any, id: string, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.delete('vehicle_receipts', id, event);
    }

    static async data_filter(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.data_filter('vehicle_receipts', event);
    }

    static async paginate(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.paginate('vehicle_receipts', event);
    }

    static async count(event: any, helpers?: BaseEntityHelpers): Promise<any> {
        const h = helpers || baseEntityHelpers;
        return h.count('vehicle_receipts', event);
    }

    static async custom_function(event: any, helpers?: BaseEntityHelpers, sec?: MiddlewareSecurity): Promise<any> {
        const h = helpers || baseEntityHelpers;
        const s = sec || middlewareSecurity;
        if (s?.auth) await s.auth(event);

        const action = event?.action || event?.functionName || event?.name || '';

        // Soporte para generación de PDF del recibo con firmas digitales incluidas
        if (action === 'GENERATE_PDF' || action === 'generate_pdf' || action === 'pdf' || event.generate_pdf) {
            let receiptData = event.receipt_data || event.data || event;
            if (event.id && (!receiptData.license_plate || !receiptData.client_signature)) {
                const dbRecords = await h.data_filter('vehicle_receipts', { id: event.id });
                if (dbRecords && (Array.isArray(dbRecords) ? dbRecords.length > 0 : dbRecords.data?.length > 0)) {
                    const record = Array.isArray(dbRecords) ? dbRecords[0] : dbRecords.data[0];
                    receiptData = { ...record, ...receiptData };
                }
            }

            let extList = receiptData.checklist_external || [];
            if (typeof extList === 'string') {
                try { extList = JSON.parse(extList); } catch { extList = []; }
            }

            let intList = receiptData.checklist_internal || [];
            if (typeof intList === 'string') {
                try { intList = JSON.parse(intList); } catch { intList = []; }
            }

            let dmgList = receiptData.damage_points || [];
            if (typeof dmgList === 'string') {
                try { dmgList = JSON.parse(dmgList); } catch { dmgList = []; }
            }

            const pdfBytes = await ReceiptPdfService.generateReceiptPdf({
                receipt_number: receiptData.receipt_number,
                entry_date: receiptData.entry_date || new Date().toISOString().split('T')[0],
                exit_date: receiptData.exit_date,
                owner_name: receiptData.owner_name,
                owner_tax_id: receiptData.owner_tax_id,
                phone: receiptData.phone,
                address: receiptData.address,
                license_plate: receiptData.license_plate || 'SIN_PLACA',
                brand: receiptData.brand || '',
                model: receiptData.model || '',
                color: receiptData.color,
                mileage: receiptData.mileage,
                fuel_level: receiptData.fuel_level,
                reason_for_entry: receiptData.reason_for_entry,
                observations: receiptData.observations,
                received_by: receiptData.received_by,
                delivered_by: receiptData.delivered_by,
                assigned_technician: receiptData.assigned_technician,
                authorized_services: receiptData.authorized_services,
                client_signature: receiptData.client_signature || receiptData.signature_client || receiptData.firma_cliente || '',
                mechanic_signature: receiptData.mechanic_signature || receiptData.signature_mechanic || receiptData.firma_tecnico || receiptData.firma_mecanico || '',
                checklist_external: extList,
                checklist_internal: intList,
                damage_points: dmgList,
            });

            return {
                status: 'success',
                filename: `Ficha_Recepcion_${receiptData.license_plate || 'vehiculo'}_${receiptData.receipt_number || 'REC'}.pdf`,
                pdf_base64: Buffer.from(pdfBytes).toString('base64'),
                content_type: 'application/pdf'
            };
        }

        return { status: 'success', message: 'Action processed' };
    }
}
