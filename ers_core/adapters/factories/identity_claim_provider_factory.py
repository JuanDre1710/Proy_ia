from __future__ import annotations

from ers_core.adapters.providers.demo_claims_provider import DemoClaimsProvider
from ers_core.adapters.providers.sql_server_claims_provider import SqlServerDataProvider
from ers_core.config.app_settings import AppSettings


class IdentityClaimProviderFactory:
    @staticmethod
    def create(settings: AppSettings) -> object:
        if settings.identity_data_provider == "sqlserver":
            return SqlServerDataProvider(settings.enterprise_sqlserver_connection_string)
        return DemoClaimsProvider()

