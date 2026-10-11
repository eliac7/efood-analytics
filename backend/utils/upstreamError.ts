/** Carries an HTTP status without retaining request headers or credentials. */
export class UpstreamError extends Error {
  readonly response: { status: number };
  constructor(message = "Το efood επέστρεψε μη έγκυρα δεδομένα.", status = 502) {
    super(message);
    this.name = "UpstreamError";
    this.response = { status };
  }
}
