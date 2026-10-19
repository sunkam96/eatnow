// Shapes and limits shared by the frontend and the Netlify functions.

export const MAX_MEMBERS = 12
export const NAME_MAX_LENGTH = 20
export const CLOSES_HOURS_AFTER_DINNER = 6
export const MAX_DAYS_AHEAD = 90

export interface CreateRoomRequest {
  hostName: string
  startsAt: number // ms since epoch
  area: string // neighborhood id, or "anywhere"
  from: string // neighborhood id the host is coming from
}

export interface CreateRoomResponse {
  roomId: string
  memberToken: string
}

export interface JoinRoomRequest {
  name: string
  from: string
}

export interface JoinRoomResponse {
  memberToken: string
}

export interface RoomMember {
  name: string
  from: string
  joinedAt: number
  host: boolean
  you: boolean
}

export interface RoomView {
  roomId: string
  startsAt: number
  expiresAt: number
  area: string
  members: RoomMember[]
}

export type ApiErrorCode =
  | 'not_found'
  | 'room_full'
  | 'bad_name'
  | 'bad_location'
  | 'bad_time'
  | 'server_error'
