import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomView,
} from './shared/api'

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

const postJson = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export function createRoom(body: CreateRoomRequest) {
  return request<CreateRoomResponse>('/api/rooms', postJson(body))
}

export function joinRoom(roomId: string, body: JoinRoomRequest) {
  return request<JoinRoomResponse>(`/api/rooms/${roomId}/join`, postJson(body))
}

export function fetchRoom(roomId: string, token: string | null) {
  return request<RoomView>(`/api/rooms/${roomId}`, {
    headers: token ? { 'X-Member-Token': token } : {},
    cache: 'no-store',
  })
}
