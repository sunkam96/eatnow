// POST /api/rooms  { hostName, startsAt, area, from }  ->  { roomId, memberToken }
// The host is the room's first member.
import type { CreateRoomResponse } from '../../src/shared/api'
import { errorResponse, readJson } from '../lib/http'
import { createRoom } from '../lib/rooms'

export default async (req: Request) => {
  try {
    const result = await createRoom(await readJson(req))
    if (!result.ok) return errorResponse(result.error)
    const body: CreateRoomResponse = { roomId: result.roomId, memberToken: result.token }
    return Response.json(body, { status: 201 })
  } catch (err) {
    console.error(err)
    return errorResponse('server_error')
  }
}

export const config = { path: '/api/rooms', method: 'POST' }
