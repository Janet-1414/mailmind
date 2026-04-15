from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator
from app.config import get_settings

Base = declarative_base()


class DatabaseConnection:
    def __init__(self, database_url: str):
        self.engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False}
            if "sqlite" in database_url
            else {},
        )
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def create_all_tables(self) -> None:
        Base.metadata.create_all(bind=self.engine)

    def get_session(self) -> Generator[Session, None, None]:
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()


_db_connection = DatabaseConnection(get_settings().DATABASE_URL)


def get_db() -> Generator[Session, None, None]:
    yield from _db_connection.get_session()


def create_tables() -> None:
    from app.auth.models import User          # noqa: F401
    from app.threads.models import Thread     # noqa: F401
    from app.memory.models import EmailLog    # noqa: F401
    from app.feedback.models import Feedback  # noqa: F401
    _db_connection.create_all_tables()
