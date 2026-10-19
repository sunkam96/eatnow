// All room storage lives here. Swapping Netlify Blobs for another store
// (e.g. Firebase) later means rewriting this file only.
//
// Layout in the "rooms" store:
//   {roomId}/meta                    -> RoomMeta
//   {roomId}/members/{memberToken}   -> MemberRecord   (one key per person, so
//                                       simultaneous joins can't overwrite each other)
//
// Locations are neighborhood ids only. We never receive or store coordinates.

import { getStore } from '@netlify/blobs'
import {
  CLOSES_HOURS_AFTER_DINNER,
  MAX_DAYS_AHEAD,
  MAX_MEMBERS,
  NAME_MAX_LENGTH,
  type RoomView,
} from '../../src/shared/api'
import { ANYWHERE, isNeighborhoodId } from '../../src/shared/neighborhoods'

const HOUR = 60 * 60 * 1000
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o, 1/l/i
const ID_LENGTH = 5
const ROOM_ID_PATTERN = new RegExp(`^[${ALPHABET}]{${ID_LENGTH}}$`)

interface RoomMeta {
  id: string
  createdAt: number
  startsAt: number
  expiresAt: number
  area: string
}

interface MemberRecord {
  name: string
  from: string
  joinedAt: number
  host: boolean
}

// "strong" so a poll right after a join sees the new member; the default can lag.
const store = () => getStore({ name: 'rooms', consistency: 'strong' })

function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const length = Array.from(name).length
  return length >= 1 && length <= NAME_MAX_LENGTH ? name : null
}

function isValidStartTime(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  const now = Date.now()
  return value >= now - 2 * HOUR && value <= now + MAX_DAYS_AHEAD * 24 * HOUR
}

export type CreateResult =
  | { ok: true; roomId: string; token: string }
  | { ok: false; error: 'bad_name' | 'bad_location' | 'bad_time' }

export async function createRoom(input: Record<string, unknown>): Promise<CreateResult> {
  const name = cleanName(input.hostName)
  if (!name) return { ok: false, error: 'bad_name' }

  const from = input.from
  const area = input.area
  if (!isNeighborhoodId(from)) return { ok: false, error: 'bad_location' }
  if (area !== ANYWHERE && !isNeighborhoodId(area)) return { ok: false, error: 'bad_location' }

  const startsAt = input.startsAt
  if (!isValidStartTime(startsAt)) return { ok: false, error: 'bad_time' }

  const rooms = store()
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = Date.now()
    const meta: RoomMeta = {
      id: newRoomId(),
      createdAt: now,
      startsAt,
      expiresAt: startsAt + CLOSES_HOURS_AFTER_DINNER * HOUR,
      area: area as string,
    }
    const result = await rooms.setJSON(`${meta.id}/meta`, meta, { onlyIfNew: true })
    if (!result.modified) continue

    const token = crypto.randomUUID()
    const host: MemberRecord = { name, from, joinedAt: now, host: true }
    await rooms.setJSON(`${meta.id}/members/${token}`, host)
    return { ok: true, roomId: meta.id, token }
  }
  throw new Error('Could not find a free room id')
}

async function getLiveRoom(roomId: string): Promise<RoomMeta | null> {
  if (!ROOM_ID_PATTERN.test(roomId)) return null
  const meta = (await store().get(`${roomId}/meta`, { type: 'json' })) as RoomMeta | null
  if (!meta || typeof meta.startsAt !== 'number' || meta.expiresAt < Date.now()) return null
  return meta
}

async function listMembers(roomId: string) {
  const rooms = store()
  const prefix = `${roomId}/members/`
  const { blobs } = await rooms.list({ prefix })
  const members = await Promise.all(
    blobs.map(async (blob) => ({
      token: blob.key.slice(prefix.length),
      record: (await rooms.get(blob.key, { type: 'json' })) as MemberRecord | null,
    })),
  )
  return members
    .filter((m): m is { token: string; record: MemberRecord } => m.record !== null)
    .sort((a, b) => a.record.joinedAt - b.record.joinedAt)
}

export type JoinResult =
  | { ok: true; token: string }
  | { ok: false; error: 'not_found' | 'room_full' | 'bad_name' | 'bad_location' }

export async function addMember(
  roomId: string,
  rawName: unknown,
  from: unknown,
): Promise<JoinResult> {
  const name = cleanName(rawName)
  if (!name) return { ok: false, error: 'bad_name' }
  if (!isNeighborhoodId(from)) return { ok: false, error: 'bad_location' }

  const room = await getLiveRoom(roomId)
  if (!room) return { ok: false, error: 'not_found' }

  const members = await listMembers(roomId)
  if (members.length >= MAX_MEMBERS) return { ok: false, error: 'room_full' }

  const token = crypto.randomUUID()
  const record: MemberRecord = { name, from, joinedAt: Date.now(), host: false }
  await store().setJSON(`${roomId}/members/${token}`, record)
  return { ok: true, token }
}

// What phones see. Never includes anyone's token.
export async function getRoomView(
  roomId: string,
  viewerToken: string | null,
): Promise<RoomView | null> {
  const room = await getLiveRoom(roomId)
  if (!room) return null
  const members = await listMembers(roomId)
  return {
    roomId: room.id,
    startsAt: room.startsAt,
    expiresAt: room.expiresAt,
    area: room.area,
    members: members.map(({ token, record }) => ({
      name: record.name,
      from: record.from,
      joinedAt: record.joinedAt,
      host: record.host,
      you: viewerToken !== null && token === viewerToken,
    })),
  }
}
