// POST /api/rooms/:id/join  { name, from }  ->  { memberToken }
// The phone keeps the token; it's how the room knows which person is "you".
import type { JoinRoomResponse } from '../../src/shared/api'
import { errorResponse, readJson, type Context } from '../lib/http'
import { addMember } from '../lib/rooms'

export default async (req: Request, context: Context) => {
  try {
    const body = await readJson(req)
    const result = await addMember(context.params.id ?? '', body.name, body.from)
    if (!result.ok) return errorResponse(result.error)
    const response: JoinRoomResponse = { memberToken: result.token }
    return Response.json(response, { status: 201 })
  } catch (err) {
    console.error(err)
    return errorResponse('server_error')
  }
}

export const config = { path: '/api/rooms/:id/join', method: 'POST' }
