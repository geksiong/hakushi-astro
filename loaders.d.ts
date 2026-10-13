export function hakushiSchema(options?: { extend?: Record<string, unknown> }): any;
export function hakushiLoader(options: { base: string; pattern?: string }): unknown;
export function createHakushiCollections(options?: { base?: string; schema?: unknown; collections?: Array<{ id: string }> }): Record<string, unknown>;
