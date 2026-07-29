from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from events import subscribe, unsubscribe, event_generator

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/stream")
async def agent_stream():
    """SSE endpoint — clients subscribe to get real-time agent events."""
    q = await subscribe()

    async def generate():
        try:
            async for chunk in event_generator(q):
                yield chunk
        finally:
            unsubscribe(q)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
