"""Deterministic hashing and PRNG.

Ported from the original TypeScript engine. JavaScript's bitwise operators
coerce to 32-bit ints and `Math.imul` multiplies as int32; Python ints are
arbitrary precision, so every step masks back to 32 bits explicitly to
reproduce the exact same sequence. Everything is kept in unsigned 32-bit
space — XOR, logical shifts, addition and imul all produce the same bit
pattern there as JS produces in its signed int32 view.
"""

from __future__ import annotations

from collections.abc import Callable

MASK32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    """Bit-pattern equivalent of JavaScript's Math.imul."""
    return (a * b) & MASK32


def hash_string(value: str) -> int:
    """FNV-1a hash -> unsigned 32-bit int."""
    h = 2166136261
    for char in value:
        h ^= ord(char)
        h = _imul(h, 16777619)
    return h & MASK32


def seeded_rng(seed: int) -> Callable[[], float]:
    """Mulberry32 — small, fast, deterministic PRNG from a 32-bit seed."""
    state = seed & MASK32

    def _next() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & MASK32
        t = _imul(state ^ (state >> 15), 1 | state)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) & MASK32) ^ t
        return ((t ^ (t >> 14)) & MASK32) / 4294967296.0

    return _next
