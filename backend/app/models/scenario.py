from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.sql import func
from ..database.database import Base


class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    target_host = Column(String, nullable=False)
    threat_actor = Column(String, nullable=False)
    evidence_count = Column(Integer, default=0)
    time_window = Column(String, nullable=False)
    narrative = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
