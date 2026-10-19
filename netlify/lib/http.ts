import type { ApiErrorCode } from '../../src/shared/api'

// The bits of Netlify's function context we use.
export interface Context {
  params: Record<string, string | undefined>
}

const STATUS: Record<ApiErrorCode, number> = {
  bad_name: 400,
  bad_location: 400,
  bad_time: 400,
  not_found: 404,
  room_full: 409,
  server_error: 500,
}

export function errorResponse(error: ApiErrorCode): Response {
  return Response.json({ error }, { status: STATUS[error] })
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null)
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
}
