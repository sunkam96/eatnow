// All room storage lives here. Swapping Netlify Blobs for another store
// (e.g. Firebase) later means rewriting this file only.
//
// Layout in the "rooms" store:
//   {roomId}/meta                    -> RoomMeta
//   {roomId}/members/{memberToken}   -> MemberRecord   (one key per person, so
//                                       simultaneous joins can't overwrite each other)

import { getStore } from '@netlify/blobs'
import {
  MAX_MEMBERS,
  NAME_MAX_LENGTH,
  ROOM_TTL_HOURS,
  type RoomView,
} from '../../src/shared/api'

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o, 1/l/i
const ID_LENGTH = 5
const ROOM_ID_PATTERN = new RegExp(`^[${ALPHABET}]{${ID_LENGTH}}$`)

interface RoomMeta {
  id: string
  createdAt: number
  expiresAt: number
}

interface MemberRecord {
  name: string
  joinedAt: number
}

// "strong" so a poll right after a join sees the new member; the default can lag.
const store = () => getStore({ name: 'rooms', consistency: 'strong' })

function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export async function createRoom(): Promise<RoomMeta> {
  const rooms = store()
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = Date.now()
    const meta: RoomMeta = {
      id: newRoomId(),
      createdAt: now,
      expiresAt: now + ROOM_TTL_HOURS * 60 * 60 * 1000,
    }
    const result = await rooms.setJSON(`${meta.id}/meta`, meta, { onlyIfNew: true })
    if (result.modified) return meta
  }
  throw new Error('Could not find a free room id')
}

async function getLiveRoom(roomId: string): Promise<RoomMeta | null> {
  if (!ROOM_ID_PATTERN.test(roomId)) return null
  const meta = (await store().get(`${roomId}/meta`, { type: 'json' })) as RoomMeta | null
  if (!meta || meta.expiresAt < Date.now()) return null
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

function cleanName(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type JoinResult =
  | { ok: true; token: string }
  | { ok: false; error: 'not_found' | 'room_full' | 'bad_name' }

export async function addMember(roomId: string, rawName: string): Promise<JoinResult> {
  const name = cleanName(rawName)
  const length = Array.from(name).length
  if (length < 1 || length > NAME_MAX_LENGTH) return { ok: false, error: 'bad_name' }

  const room = await getLiveRoom(roomId)
  if (!room) return { ok: false, error: 'not_found' }

  const members = await listMembers(roomId)
  if (members.length >= MAX_MEMBERS) return { ok: false, error: 'room_full' }

  const token = crypto.randomUUID()
  const record: MemberRecord = { name, joinedAt: Date.now() }
  await store().setJSON(`${roomId}/members/${token}`, record)
  return { ok: true, token }
}

// What phones see. Never includes other people's tokens.
export async function getRoomView(
  roomId: string,
  viewerToken: string | null,
): Promise<RoomView | null> {
  const room = await getLiveRoom(roomId)
  if (!room) return null
  const members = await listMembers(roomId)
  return {
    roomId: room.id,
    expiresAt: room.expiresAt,
    members: members.map(({ token, record }) => ({
      name: record.name,
      joinedAt: record.joinedAt,
      you: viewerToken !== null && token === viewerToken,
    })),
  }
}
