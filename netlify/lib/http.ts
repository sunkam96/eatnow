import type { ApiErrorCode } from '../../src/shared/api'

// The bits of Netlify's function context we use.
export interface Context {
  params: Record<string, string | undefined>
}

const STATUS: Record<ApiErrorCode, number> = {
  bad_name: 400,
  not_found: 404,
  room_full: 409,
  server_error: 500,
}

export function errorResponse(error: ApiErrorCode): Response {
  return Response.json({ error }, { status: STATUS[error] })
}
