import { connectToDatabase } from '@/lib/mongodb';
import { subscribeToMatch } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { shareToken } = params;

  const { db } = await connectToDatabase();
  const initialMatch = await db.collection('matches').findOne({ shareToken });

  if (!initialMatch || !initialMatch.shareEnabled) {
    return new Response(JSON.stringify({ error: 'Live stream unavailable' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const initialPayload = JSON.stringify({
        type: 'INIT',
        match: sanitizePublicMatch(initialMatch),
      });
      controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      const unsubscribe = subscribeToMatch(shareToken, (updatedMatch) => {
        try {
          if (!updatedMatch.shareEnabled) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'DISABLED' })}\n\n`));
            controller.close();
            return;
          }
          const payload = JSON.stringify({
            type: 'UPDATE',
            match: sanitizePublicMatch(updatedMatch),
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error('[REALTIME STREAM ERROR]', err);
        }
      });

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function sanitizePublicMatch(m) {
  return {
    teamA: m.teamA,
    teamB: m.teamB,
    overs: m.overs,
    battingFirst: m.battingFirst,
    currentInnings: m.currentInnings,
    target: m.target,
    status: m.status,
    result: m.result,
    innings1: m.innings1,
    innings2: m.innings2,
    updatedAt: m.updatedAt,
    shareToken: m.shareToken,
  };
}
