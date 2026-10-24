import { dispatchFlowStep } from 'skd-grql';
import { SECRET_KEY, set_db, refreshHelpers } from './config';
import { ENTITY_REGISTRY } from './registry';
import { GestionTallerProdCatalogState } from './entities/catalog_state';
import { clearFkCache } from './helpers/fk_cache';

function sanitizeQuery(query: any): void {
    if (!query || typeof query !== 'object') return;

    const rawArrayFilter = Array.isArray(query.arrayFilter) ? query.arrayFilter : [];
    const normalizedArrayFilter: any[] = [];

    for (const item of rawArrayFilter) {
        if (!item || typeof item !== 'object') continue;
        if (item.field !== undefined) {
            normalizedArrayFilter.push(item);
        } else {
            for (const [k, v] of Object.entries(item)) {
                normalizedArrayFilter.push({ field: k, value: v });
            }
        }
    }

    if (query.filter && typeof query.filter === 'object') {
        const filterObj = query.filter;
        if (filterObj.field !== undefined && filterObj.value !== undefined) {
            const fName = String(filterObj.field);
            if (!normalizedArrayFilter.some((f: any) => f?.field === fName)) {
                normalizedArrayFilter.push({ field: fName, value: filterObj.value });
            }
        } else {
            for (const [k, v] of Object.entries(filterObj)) {
                if (!normalizedArrayFilter.some((f: any) => f?.field === k)) {
                    normalizedArrayFilter.push({ field: k, value: v });
                }
            }
        }
        delete query.filter;
    }

    query.arrayFilter = normalizedArrayFilter;
}

async function main() {
    process.stdin.setEncoding('utf-8');
    let input = '';
    for await (const chunk of process.stdin) input += chunk;

    try {
        if (!input.trim()) return;
        const event = JSON.parse(input);

        set_db(event);
        refreshHelpers();
        clearFkCache();

        const flows = event.request?.flows || event.flows || [];
        const flow = flows.find((f: any) => f.name === "workflow_taller")
            || flows[0];
        const output: Record<string, any> = {};

        if (flow) {
            const context = {
                header: event.headerLambda,
                decodeBase64: event.headerLambdaObject
                    ? Buffer.from(event.headerLambdaObject, 'base64').toString('utf-8')
                    : null,
                fileMeta: event.fileMeta,
                fileMetas: event.fileMetas,
            };

            for (const step of flow.steps || []) {
                const stepKey = step.name || step.functionName || 'step';
                const EntityClass = ENTITY_REGISTRY[step.name]
                    || ENTITY_REGISTRY[step.functionName]
                    || (String(step.name).toLowerCase().includes('catalog') ? GestionTallerProdCatalogState : null);

                if (EntityClass) {
                    const rawActions = step.actions || [];
                    const actions = (rawActions.length > 0 ? rawActions : [{ name: 'custom_function', action: 'custom_function' }]).map((act: any) => {
                        const normalizedAct = {
                            ...act,
                            name: act.name || act.action || 'custom_function'
                        };
                        if (normalizedAct.params?.query) {
                            sanitizeQuery(normalizedAct.params.query);
                        } else if (normalizedAct.params && (normalizedAct.params.filter || normalizedAct.params.arrayFilter)) {
                            sanitizeQuery(normalizedAct.params);
                        }
                        return normalizedAct;
                    });

                    if (actions.length > 1) {
                        const stepResults = await Promise.all(
                            actions.map((act: any) => {
                                const singleActionStep = { ...step, actions: [act] };
                                return dispatchFlowStep(stepKey, EntityClass, singleActionStep, context, SECRET_KEY);
                            })
                        );
                        if (output[stepKey] !== undefined) {
                            if (Array.isArray(output[stepKey])) {
                                output[stepKey].push(...stepResults);
                            } else {
                                output[stepKey] = [output[stepKey], ...stepResults];
                            }
                        } else {
                            output[stepKey] = stepResults.length === 1 ? stepResults[0] : stepResults;
                        }
                    } else {
                        const singleActionStep = { ...step, actions };
                        const res = await dispatchFlowStep(stepKey, EntityClass, singleActionStep, context, SECRET_KEY);
                        if (output[stepKey] !== undefined) {
                            if (Array.isArray(output[stepKey])) {
                                output[stepKey].push(res);
                            } else {
                                output[stepKey] = [output[stepKey], res];
                            }
                        } else {
                            output[stepKey] = res;
                        }
                    }
                }
            }
        }

        process.stdout.write(JSON.stringify(output) + '\n');
    } catch (error: any) {
        process.stdout.write(JSON.stringify({ error: { message: error.message || "Internal Server Error" } }) + '\n');
    }
}

main();
