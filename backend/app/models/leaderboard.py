from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.sql import func
from ..database.database import Base


class LeaderboardEntryModel(Base):
    __tablename__ = "leaderboard"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, nullable=False)
    title = Column(String, nullable=False)
    xp = Column(Integer, default=0)
    labs_completed = Column(Integer, default=0)
    avg_accuracy = Column(Float, default=0.0)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
