from sqlalchemy import Column, Integer, String, Boolean, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String, default="12345")
    role = Column(String)
    team = Column(String, nullable=False) # L1, L2, L3, DevOps, Security
    expertise_tags = Column(JSON) # e.g., ["docker", "kubernetes", "windows"]
    skill_level = Column(Integer) # 1 to 5
    current_load = Column(Integer, default=0)
    availability_status = Column(Boolean, default=True)
    avg_resolution_time = Column(Float, default=0.0)
    priority_handling_capability = Column(String) # Low, Medium, High

    tickets = relationship("Ticket", foreign_keys="[Ticket.assigned_employee_id]", back_populates="assigned_agent")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    requester_name = Column(String, default="Unknown User")
    description = Column(String)
    category = Column(String)
    subcategory = Column(String)
    severity = Column(Integer)
    urgency = Column(Integer)
    priority_score = Column(Float)
    status = Column(String, default="open") # open, in_progress, resolved, closed
    resolution_notes = Column(String, nullable=True)
    pipeline_path = Column(String, nullable=True) # Action, FAQ, Complex
    
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"))
    requester_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    assigned_agent = relationship("Employee", foreign_keys=[assigned_employee_id], back_populates="tickets")
    requester = relationship("Employee", foreign_keys=[requester_id])


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True) # if tied to a ticket
    sender_id = Column(String, nullable=False) # e.g. 'Admin', 'User:John', 'Employee:3'
    receiver_id = Column(String, nullable=True) # e.g. 'Employee:3'. If tied to a ticket, this might be null
    sender_name = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
