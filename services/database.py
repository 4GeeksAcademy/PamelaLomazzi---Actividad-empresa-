from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine

logger = logging.getLogger(__name__)
load_dotenv(
    dotenv_path=Path(__file__).resolve().parent.parent / ".env",
    encoding="utf-8",
)

raw_database_url = os.getenv("DATABASE_URL", "sqlite:///./healthcore.db")
DATABASE_URL = raw_database_url.strip()
if not DATABASE_URL:
    raise ValueError("DATABASE_URL está definida, pero está vacía.")

database_url = make_url(DATABASE_URL)
logger.info(
    "Conectando a la base de datos: %s",
    database_url.render_as_string(hide_password=True),
)
connect_args = {"check_same_thread": False} if database_url.drivername.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session