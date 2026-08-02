from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database.database import Base


class EvaluationResultModel(Base):
    __tablename__ = "evaluation_results"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=0.0)
    chronological_accuracy = Column(Float, default=0.0)
    mitre_accuracy = Column(Float, default=0.0)
    kill_chain_accuracy = Column(Float, default=0.0)
    relationship_accuracy = Column(Float, default=0.0)
    mistakes = Column(Text, nullable=True)
    hints = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    stars_earned = Column(Integer, default=0)
    xp_gained = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
