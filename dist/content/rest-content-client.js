import { M1PageSchemaValidator } from '@jmgduarte/headless-core';
export class RestContentClient {
    options;
    validator;
    constructor(options) {
        this.options = options;
        this.validator = options.validator ?? new M1PageSchemaValidator();
    }
    async getPage(slug, request = {}) {
        const candidate = await this.options.transport.get(this.options.endpoints.pageBySlug({ slug, locale: request.locale }), { signal: request.signal });
        return this.validator.validate(candidate);
    }
    async getNavigation(location, request = {}) {
        const candidate = await this.options.transport.get(this.options.endpoints.navigationByLocation({ location, locale: request.locale }), { signal: request.signal });
        return validateNavigation(candidate);
    }
    async submitForm(formId, values, nonce, request = {}) {
        const response = await this.options.transport.post(this.options.endpoints.submitForm({ formId }), { values, nonce }, { signal: request.signal, headers: { 'Content-Type': 'application/json' } });
        if (!isRecord(response) || typeof response['formId'] !== 'string' || typeof response['success'] !== 'boolean')
            throw new Error('Form submission response is invalid.');
        return { formId: response['formId'], success: response['success'], ...(typeof response['message'] === 'string' ? { message: response['message'] } : {}) };
    }
}
function validateNavigation(value) {
    if (!isRecord(value) || value['schemaVersion'] !== '1.0' || typeof value['location'] !== 'string' || !isRecord(value['menu']) || !Array.isArray(value['items']))
        throw new Error('Navigation schema is invalid.');
    return {
        schemaVersion: '1.0',
        location: value['location'],
        menu: {
            ariaLabel: typeof value['menu']['ariaLabel'] === 'string' ? value['menu']['ariaLabel'] : 'Navigation',
            orientation: value['menu']['orientation'] === 'vertical' ? 'vertical' : 'horizontal',
        },
        items: value['items'].filter(isNavigationItem),
    };
}
function isNavigationItem(value) {
    return isRecord(value) && typeof value['id'] === 'string' && typeof value['label'] === 'string' && isRecord(value['link']);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
