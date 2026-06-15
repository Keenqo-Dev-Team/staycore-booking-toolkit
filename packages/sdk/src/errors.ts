/**
 * Error class raised by {@link createPmsClient} when the Stay'Core API returns
 * a non-2xx response or `{ success: false }` envelope.
 */
export class StayCoreApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly endpoint: string;

  constructor(message: string, status: number, body: unknown, endpoint: string) {
    super(message);
    this.name = 'StayCoreApiError';
    this.status = status;
    this.body = body;
    this.endpoint = endpoint;
  }

  /** True if the error is a 4xx (caller fault). */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** True if the error is a 5xx (server fault, may be retried). */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}
