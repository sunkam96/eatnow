// Shapes and limits shared by the frontend and the Netlify functions.

export const ROOM_TTL_HOURS = 4
export const MAX_MEMBERS = 12
export const NAME_MAX_LENGTH = 20

export interface CreateRoomResponse {
  roomId: string
  expiresAt: number
}

export interface JoinRoomResponse {
  memberToken: string
}

export interface RoomMember {
  name: string
  joinedAt: number
  you: boolean
}

export interface RoomView {
  roomId: string
  expiresAt: number
  members: RoomMember[]
}

export type ApiErrorCode = 'not_found' | 'room_full' | 'bad_name' | 'server_error'
