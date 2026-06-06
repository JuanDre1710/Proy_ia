from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


RuleSeverityApi = Literal["Alta", "Media", "Baja"]
RuleStatusApi = Literal["Activa", "Monitoreada"]
RuleTypeApi = Literal["json_high_amount_suspicious_images"]


class ConfiguredRuleParametersDto(BaseModel):
    amountThreshold: float = Field(ge=0.0)


class ConfiguredRuleCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    category: str = Field(min_length=2, max_length=80)
    severity: RuleSeverityApi
    status: RuleStatusApi
    source: str | None = Field(default=None, max_length=120)
    description: str = Field(min_length=10, max_length=400)
    ruleType: RuleTypeApi
    parameters: ConfiguredRuleParametersDto


class ConfiguredRuleResponse(BaseModel):
    id: str
    name: str
    category: str
    severity: RuleSeverityApi
    status: RuleStatusApi
    source: str | None = None
    description: str
    ruleType: RuleTypeApi
    parameters: dict[str, Any] = Field(default_factory=dict)
    createdAt: str
    updatedAt: str
    updatedBy: str | None = None
