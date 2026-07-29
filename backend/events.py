"""
Simple in-memory pub-sub for real-time agent events via SSE.
Each connected client gets its own asyncio.Queue.
"""
import asyncio
import json
from typing import AsyncGenerator

_subscribers: list[asyncio.Queue] = []


async def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(q)
    return q


def unsubscribe(q: asyncio.Queue):
    try:
        _subscribers.remove(q)
    except ValueError:
        pass


async def broadcast(agent: str, status: str, action: str = "", extra: dict = {}):
    """Broadcast an agent state change to all connected SSE clients."""
    payload = json.dumps({"agent": agent, "status": status, "action": action, **extra})
    dead = []
    for q in _subscribers:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        unsubscribe(q)


async def event_generator(q: asyncio.Queue) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted events from queue with keepalive pings."""
    try:
        while True:
            try:
                data = await asyncio.wait_for(q.get(), timeout=25)
                yield f"data: {data}\n\n"
            except asyncio.TimeoutError:
                yield "data: {\"ping\":true}\n\n"  # keepalive
    except asyncio.CancelledError:
        pass
