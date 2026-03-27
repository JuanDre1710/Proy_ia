from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LoginRequestDto(BaseModel):
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=120)


class RefreshRequestDto(BaseModel):
    refreshToken: str = Field(min_length=10)


class LogoutRequestDto(BaseModel):
    refreshToken: str | None = None


class AuthUserDto(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["Admin", "Supervisor", "Evaluador"]
    lastLogin: str | None = None


class AuthSessionDto(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: str
    user: AuthUserDto


class MeDto(BaseModel):
    user: AuthUserDto
    expiresAt: str
