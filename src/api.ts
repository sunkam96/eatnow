import type { CreateRoomResponse, JoinRoomResponse, RoomView } from './shared/api'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new ApiError('network', 0)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const code = body && typeof body.error === 'string' ? body.error : 'server_error'
    throw new ApiError(code, res.status)
  }
  return body as T
}

export function createRoom() {
  return request<CreateRoomResponse>('/api/rooms', { method: 'POST' })
}

export function joinRoom(roomId: string, name: string) {
  return request<JoinRoomResponse>(`/api/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

export function fetchRoom(roomId: string, token: string | null) {
  return request<RoomView>(`/api/rooms/${roomId}`, {
    headers: token ? { 'X-Member-Token': token } : {},
    cache: 'no-store',
  })
}
