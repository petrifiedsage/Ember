import logging
import uuid
from contextvars import ContextVar


request_id_context: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


def configure_logging() -> None:
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s",
        )

    for handler in root_logger.handlers:
        if not any(isinstance(existing_filter, RequestIdFilter) for existing_filter in handler.filters):
            handler.addFilter(RequestIdFilter())


def generate_request_id() -> str:
    return uuid.uuid4().hex