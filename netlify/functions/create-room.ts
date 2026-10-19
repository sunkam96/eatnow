// POST /api/rooms: create a room and return its id.
// TODO: generate a short id, save rooms/{id} to Netlify Blobs with an expiry.
export default async () => {
  return Response.json({ error: 'Not implemented yet' }, { status: 501 })
}

export const config = { path: '/api/rooms', method: 'POST' }
