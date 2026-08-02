from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    title = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    true_timestamp_ms = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    source = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    host = Column(String, nullable=False)
    user = Column(String, nullable=False)
    raw_log = Column(Text, nullable=False)
    hint = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
