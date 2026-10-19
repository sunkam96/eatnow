// GET /api/rooms/:id: what phones poll every few seconds.
// Send the member token in X-Member-Token to get your own entry marked "you".
import { errorResponse, type Context } from '../lib/http'
import { getRoomView } from '../lib/rooms'

export default async (req: Request, context: Context) => {
  try {
    const view = await getRoomView(context.params.id ?? '', req.headers.get('x-member-token'))
    if (!view) return errorResponse('not_found')
    return Response.json(view, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error(err)
    return errorResponse('server_error')
  }
}

export const config = { path: '/api/rooms/:id', method: 'GET' }
