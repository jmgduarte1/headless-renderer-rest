import { ContentClient, ContentRequestOptions, FormSubmissionResponse, NavigationSchema, PageSchema, M1PageSchemaValidator } from '@jmgduarte/headless-core';
import { RestTransport } from '../transport/rest-transport.js';
export interface RestContentEndpoints {
    pageBySlug: (args: {
        slug: string;
        locale?: string;
    }) => string;
    navigationByLocation: (args: {
        location: string;
        locale?: string;
    }) => string;
    submitForm: (args: {
        formId: string;
    }) => string;
}
export interface RestContentClientOptions {
    transport: RestTransport;
    endpoints: RestContentEndpoints;
    validator?: M1PageSchemaValidator;
}
interface RestContentRequestOptions extends ContentRequestOptions {
    signal?: AbortSignal;
}
export declare class RestContentClient implements ContentClient {
    private readonly options;
    private readonly validator;
    constructor(options: RestContentClientOptions);
    getPage(slug: string, request?: RestContentRequestOptions): Promise<PageSchema>;
    getNavigation(location: string, request?: RestContentRequestOptions): Promise<NavigationSchema>;
    submitForm(formId: string, values: Record<string, unknown>, nonce?: string, request?: RestContentRequestOptions): Promise<FormSubmissionResponse>;
}
export {};
