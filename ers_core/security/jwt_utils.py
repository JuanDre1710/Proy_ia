from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any


class JwtValidationError(ValueError):
    pass


def _secret() -> str:
    return os.getenv("ERS_JWT_SECRET", "ers-dev-secret-change-me")


def _b64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")


def _b64url_decode(payload: str) -> bytes:
    padding = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(payload + padding)


def encode_jwt(claims: dict[str, Any], expires_in_seconds: int, token_type: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    body = {
        **claims,
        "iat": now,
        "exp": now + expires_in_seconds,
        "typ": token_type,
    }

    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    body_segment = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        _secret().encode("utf-8"),
        f"{header_segment}.{body_segment}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{header_segment}.{body_segment}.{_b64url_encode(signature)}"


def decode_jwt(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        header_segment, body_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise JwtValidationError("Invalid JWT format.") from exc

    expected_signature = hmac.new(
        _secret().encode("utf-8"),
        f"{header_segment}.{body_segment}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature = _b64url_decode(signature_segment)
    if not hmac.compare_digest(expected_signature, signature):
        raise JwtValidationError("Invalid JWT signature.")

    payload = json.loads(_b64url_decode(body_segment))
    if int(payload.get("exp", 0)) <= int(time.time()):
        raise JwtValidationError("JWT expired.")

    token_type = payload.get("typ")
    if expected_type and token_type != expected_type:
        raise JwtValidationError("Unexpected JWT type.")

    return payload

