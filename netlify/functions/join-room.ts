// POST /api/rooms/:id/join: add a member (name + location), return their memberId.
// TODO: save rooms/{id}/members/{memberId} to Netlify Blobs.
export default async () => {
  return Response.json({ error: 'Not implemented yet' }, { status: 501 })
}

export const config = { path: '/api/rooms/:id/join', method: 'POST' }
