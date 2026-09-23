
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { subscribeToMatch } from '@/lib/realtime';

export async function GET(req, { params }) {
  const { id } = params;

  const encoder = new TextEncoder();
  let unsubscribe = null;
  let keepAliveInterval = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          // controller may already be closed if the client disconnected
        }
      };

      // Send the current state immediately on connect.
      try {
        const { db } = await connectToDatabase();
        const query = { _id: id.length === 24 ? new ObjectId(id) : id };
        const match = await db.collection('matches').findOne(query);
        if (match) {
          const safeMatch = { ...match, id: match._id ? match._id.toString() : match.id, _id: undefined };
          send({ type: 'INIT', match: safeMatch });
        } else {
          send({ type: 'NOT_FOUND' });
        }
      } catch (err) {
        console.error('[ALL-MATCH STREAM ERROR] Initial fetch failed:', err.message);
      }

      // Subscribe to future updates broadcast for this specific match id.
      unsubscribe = subscribeToMatch(`allmatch:${id}`, (data) => {
        send({ type: 'UPDATE', match: data });
      });

      // Keep the connection alive through proxies/load balancers.
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch (err) {
          // ignore — cleanup happens on cancel
        }
      }, 20000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}