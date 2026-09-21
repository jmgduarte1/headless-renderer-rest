import { ContentClient, ContentRequestOptions, FormSubmissionResponse, NavigationSchema, PageSchema, M1PageSchemaValidator } from '@jmgduarte/headless-core';
import { RestTransport } from '../transport/rest-transport.js';

export interface RestContentEndpoints {
  pageBySlug: (args: { slug: string; locale?: string }) => string;
  navigationByLocation: (args: { location: string; locale?: string }) => string;
  submitForm: (args: { formId: string }) => string;
}

export interface RestContentClientOptions {
  transport: RestTransport;
  endpoints: RestContentEndpoints;
  validator?: M1PageSchemaValidator;
}

interface RestContentRequestOptions extends ContentRequestOptions {
  signal?: AbortSignal;
}

export class RestContentClient implements ContentClient {
  private readonly validator: M1PageSchemaValidator;
  constructor(private readonly options: RestContentClientOptions) {
    this.validator = options.validator ?? new M1PageSchemaValidator();
  }

  async getPage(slug: string, request: RestContentRequestOptions = {}): Promise<PageSchema> {
    const candidate = await this.options.transport.get<unknown>(this.options.endpoints.pageBySlug({ slug, locale: request.locale }), { signal: request.signal });
    return this.validator.validate(candidate);
  }

  async getNavigation(location: string, request: RestContentRequestOptions = {}): Promise<NavigationSchema> {
    const candidate = await this.options.transport.get<unknown>(this.options.endpoints.navigationByLocation({ location, locale: request.locale }), { signal: request.signal });
    return validateNavigation(candidate);
  }

  async submitForm(formId: string, values: Record<string, unknown>, nonce?: string, request: RestContentRequestOptions = {}): Promise<FormSubmissionResponse> {
    const response = await this.options.transport.post<unknown>(this.options.endpoints.submitForm({ formId }), { values, nonce }, { signal: request.signal, headers: { 'Content-Type': 'application/json' } });
    if (!isRecord(response) || typeof response['formId'] !== 'string' || typeof response['success'] !== 'boolean') throw new Error('Form submission response is invalid.');
    return { formId: response['formId'], success: response['success'], ...(typeof response['message'] === 'string' ? { message: response['message'] } : {}) };
  }
}

function validateNavigation(value: unknown): NavigationSchema {
  if (!isRecord(value) || value['schemaVersion'] !== '1.0' || typeof value['location'] !== 'string' || !isRecord(value['menu']) || !Array.isArray(value['items'])) throw new Error('Navigation schema is invalid.');
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

function isNavigationItem(value: unknown): boolean {
  return isRecord(value) && typeof value['id'] === 'string' && typeof value['label'] === 'string' && isRecord(value['link']);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
