// GET /api/rooms/:id: what phones poll every 2-3s.
// Returns members (each with only "~N min away", never exact location) and the ranking.
// TODO: read room + members from Netlify Blobs, compute the ranking server-side.
export default async () => {
  return Response.json({ error: 'Not implemented yet' }, { status: 501 })
}

export const config = { path: '/api/rooms/:id', method: 'GET' }
