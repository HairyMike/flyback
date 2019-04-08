export interface Headers {
  [header: string]: string[];
}

export interface Request {
  url: string;
  method: string;
  headers: Headers;
  // TODO: why optional
  body?: Buffer;
}

export interface Response {
  status: number;
  headers: Headers;
  body: Buffer;
}

export type RequestOrResponse = Request | Response;
