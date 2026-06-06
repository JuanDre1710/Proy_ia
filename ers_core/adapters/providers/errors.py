from __future__ import annotations


class ProviderIntegrationError(Exception):
    def __init__(self, message: str, *, code: str) -> None:
        super().__init__(message)
        self.code = code


class ProviderDisabledError(ProviderIntegrationError):
    def __init__(self, message: str = "Provider is disabled.") -> None:
        super().__init__(message, code="disabled")


class ProviderTimeoutError(ProviderIntegrationError):
    def __init__(self, message: str = "Provider request timed out.") -> None:
        super().__init__(message, code="timeout")


class ProviderTechnicalError(ProviderIntegrationError):
    def __init__(self, message: str = "Provider technical error.") -> None:
        super().__init__(message, code="technical_error")


class ProviderInsufficientDataError(ProviderIntegrationError):
    def __init__(self, message: str = "Provider returned insufficient data.") -> None:
        super().__init__(message, code="insufficient_data")
