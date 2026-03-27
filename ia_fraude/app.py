from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse

from ers_core.config.app_settings import get_settings
from .api.audit_routes import router as audit_router
from .api.auth_routes import router as auth_router
from .api.case_routes import router as case_router
from .api.export_routes import router as export_router
from .api.integration_routes import router as integration_router
from .api.scoring_routes import router as scoring_router
from .utils.schema import EvaluacionInput
from .observability import RequestContextMiddleware, RateLimitMiddleware, configure_logging

settings = get_settings()
configure_logging(settings)
logger = logging.getLogger("ers.api")

OPENAPI_TAGS = [
    {
        "name": "auth",
        "description": "Autenticacion demo con login, refresh, logout y consulta de sesion.",
    },
    {
        "name": "cases",
        "description": "Creacion, evaluacion, detalle y resolucion manual de casos antifraude.",
    },
    {
        "name": "audit",
        "description": "Trazabilidad demo del sistema y timeline por caso.",
    },
    {
        "name": "exports",
        "description": "Exportaciones demo del caso en PDF y CSV.",
    },
    {
        "name": "admin-integrations",
        "description": "Configuracion de providers demo y futura capa de integraciones reales.",
    },
    {
        "name": "scoring",
        "description": "Servicio tabular interno de scoring usado por el pipeline demo.",
    },
]


def _error_payload(message: str, code: str, request: Request, status_code: int, details: object | None = None) -> JSONResponse:
    payload = {
        "error": {
            "code": code,
            "message": message,
            "requestId": getattr(request.state, "request_id", None),
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    observer = _start_model_watcher() if settings.enable_model_watcher else None
    logger.info("app_started", extra={"event": "startup", "extra": {"env": settings.env}})
    try:
        yield
    finally:
        if observer is not None:
            observer.stop()
            observer.join(timeout=2)
        logger.info("app_stopped", extra={"event": "shutdown", "extra": {"env": settings.env}})


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/swagger",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=OPENAPI_TAGS,
        description=(
            "API demo de ERS para evaluacion antifraude.\n\n"
            "Incluye autenticacion, pipeline de casos, scoring tabular, reasoning demo, "
            "resolucion manual, exportaciones y auditoria. "
            "Las fuentes externas estan simuladas con providers internos demo."
        ),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware, logger=logger)
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error_payload("Request validation failed.", "validation_error", request, 422, exc.errors())

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return _error_payload(str(exc.detail), "http_error", request, exc.status_code)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled_exception",
            extra={"event": "unhandled_exception", "extra": {"path": request.url.path, "request_id": getattr(request.state, "request_id", None)}},
        )
        return _error_payload("Internal server error.", "internal_error", request, 500)

    app.include_router(integration_router)
    app.include_router(auth_router)
    app.include_router(audit_router)
    app.include_router(case_router)
    app.include_router(export_router)
    app.include_router(scoring_router)

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {
            "status": "ok",
            "env": settings.env,
            "version": settings.app_version,
        }

    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/swagger")

    @app.get("/docs", include_in_schema=False)
    async def docs_redirect() -> RedirectResponse:
        return RedirectResponse(url="/swagger")

    @app.post("/evaluar")
    async def evaluar(input_data: EvaluacionInput) -> object:
        input_dict = input_data.model_dump(exclude_none=True)
        predictor = _import_predictor()
        return predictor(input_dict)

    @app.post("/reentrenar")
    async def reentrenar(input_data: EvaluacionInput) -> object:
        input_dict = input_data.model_dump(exclude_none=True)
        trainer = _import_trainer()
        return trainer(input_dict)

    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )
        components = openapi_schema.setdefault("components", {})
        security_schemes = components.setdefault("securitySchemes", {})
        security_schemes["bearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT demo obtenido desde /auth/login.",
        }

        openapi_schema["servers"] = [
            {"url": "http://localhost:8000", "description": "Local demo"},
        ]
        openapi_schema["info"]["x-demo-scope"] = {
            "mode": "demo",
            "providers": "internal_demo",
            "llm_reasoning": "not_enabled",
        }

        unsecured_paths = {
            "/",
            "/docs",
            "/swagger",
            "/redoc",
            "/openapi.json",
            "/health",
            "/auth/login",
            "/auth/refresh",
        }
        for path, methods in openapi_schema.get("paths", {}).items():
            for method_name, operation in methods.items():
                if not isinstance(operation, dict):
                    continue
                if path not in unsecured_paths:
                    operation.setdefault("security", [{"bearerAuth": []}])
                operation.setdefault("responses", {})
                operation["responses"].setdefault(
                    "500",
                    {
                        "description": "Internal server error",
                    },
                )
                if path not in {"/auth/login", "/auth/refresh"}:
                    operation["responses"].setdefault(
                        "401",
                        {
                            "description": "Unauthorized",
                        },
                    )

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi

    return app


app = create_app()


def _start_model_watcher() -> Any | None:
    try:
        from .modelos.modelo_watcher import iniciar_watcher

        return iniciar_watcher()
    except Exception:
        logger.exception("model_watcher_unavailable", extra={"event": "model_watcher_unavailable", "extra": {}})
        return None


def _import_predictor() -> Any:
    from .modelos.predictor_fraude import predecir_caso

    return predecir_caso


def _import_trainer() -> Any:
    from .modelos.entrenador_fraude import entrenar_caso

    return entrenar_caso


if __name__ == "__main__":
    uvicorn.run("ia_fraude.app:app", host="0.0.0.0", port=8000, reload=False)
