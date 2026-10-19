// POST /api/rooms: create a room and return its id.
import type { CreateRoomResponse } from '../../src/shared/api'
import { errorResponse } from '../lib/http'
import { createRoom } from '../lib/rooms'

export default async () => {
  try {
    const room = await createRoom()
    const body: CreateRoomResponse = { roomId: room.id, expiresAt: room.expiresAt }
    return Response.json(body, { status: 201 })
  } catch (err) {
    console.error(err)
    return errorResponse('server_error')
  }
}

export const config = { path: '/api/rooms', method: 'POST' }
