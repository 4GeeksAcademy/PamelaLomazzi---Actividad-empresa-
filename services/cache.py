from __future__ import annotations

from collections.abc import Callable, Hashable
from copy import deepcopy
from threading import Lock
from time import monotonic
from typing import Generic, TypeVar

CacheValue = TypeVar("CacheValue")


class TTLCache(Generic[CacheValue]):
    def __init__(self, max_entries: int = 128) -> None:
        self._entries: dict[Hashable, tuple[float, CacheValue]] = {}
        self._lock = Lock()
        self._revision = 0
        self._max_entries = max_entries

    def get_or_load(
        self, key: Hashable, ttl: float, loader: Callable[[], CacheValue]
    ) -> CacheValue:
        with self._lock:
            now = monotonic()
            self._entries = {
                entry_key: entry
                for entry_key, entry in self._entries.items()
                if entry[0] > now
            }
            entry = self._entries.get(key)
            if entry is not None:
                return deepcopy(entry[1])
            revision = self._revision

        value = loader()

        with self._lock:
            if revision == self._revision:
                if len(self._entries) >= self._max_entries:
                    self._entries.pop(next(iter(self._entries)))
                self._entries[key] = (monotonic() + ttl, deepcopy(value))
        return value

    def clear(self) -> None:
        with self._lock:
            self._revision += 1
            self._entries.clear()