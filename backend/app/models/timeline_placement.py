from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database.database import Base


class TimelinePlacement(Base):
    __tablename__ = "timeline_placements"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    evidence_id = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    assigned_mitre_technique_ids = Column(String, nullable=True)
    assigned_kill_chain_stage = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
