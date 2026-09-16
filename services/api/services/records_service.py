from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List

from services.api.schemas.records import (
    CandidateStage,
    CandidateStatus,
    Note,
    Record,
    RecordPatchPayload,
    RecordPayload,
)


class RecordNotFoundError(Exception):
    """El registro de candidatura solicitado no existe."""


class NoteNotFoundError(Exception):
    """La nota solicitada no existe."""


class RecordsService:
    """Almacenamiento en memoria de candidaturas; pensado para desarrollo/demo."""

    def __init__(self) -> None:
        self._records: Dict[str, Record] = {}
        self._notes: Dict[str, List[Note]] = {}
        self._seed()

    def _seed(self) -> None:
        seed_data = [
            {
                "full_name": "Ana Martínez",
                "email": "ana.martinez@example.com",
                "phone": "+34 600 111 222",
                "position": "Enfermera especializada",
                "experience_years": 5,
                "status": "in_progress",
                "stage": "review",
            },
            {
                "full_name": "Carlos Ruiz",
                "email": "carlos.ruiz@example.com",
                "phone": "+34 600 333 444",
                "position": "Médico de familia",
                "experience_years": 8,
                "status": "received",
                "stage": "pending",
            },
            {
                "full_name": "Laura Gómez",
                "email": "laura.gomez@example.com",
                "phone": "+34 600 555 666",
                "position": "Auxiliar administrativo",
                "experience_years": 3,
                "status": "selected",
                "stage": "offer_presented",
            },
        ]

        for item in seed_data:
            payload = RecordPayload(
                full_name=item["full_name"],
                email=item["email"],
                phone=item["phone"],
                position=item["position"],
                experience_years=item["experience_years"],
            )
            self.create_record(payload, status=item["status"], stage=item["stage"])

    def create_record(
        self,
        payload: RecordPayload,
        status: CandidateStatus = "received",
        stage: CandidateStage = "pending",
    ) -> Record:
        now = datetime.now(timezone.utc)
        record = Record(
            id=str(uuid.uuid4()),
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            position=payload.position,
            linkedin_url=payload.linkedin_url,
            cv_url=payload.cv_url,
            experience_years=payload.experience_years,
            status=status,
            stage=stage,
            applied_at=now,
            updated_at=now,
            notes_count=0,
        )
        self._records[record.id] = record
        self._notes[record.id] = []
        return record

    def list_records(self) -> List[Record]:
        return sorted(self._records.values(), key=lambda r: r.applied_at, reverse=True)

    def get_record(self, record_id: str) -> Record:
        record = self._records.get(record_id)
        if record is None:
            raise RecordNotFoundError(f"No existe el registro {record_id}.")
        return record

    def update_record(self, record_id: str, payload: RecordPayload) -> Record:
        record = self.get_record(record_id)
        updated = record.model_copy(
            update={
                "full_name": payload.full_name,
                "email": payload.email,
                "phone": payload.phone,
                "position": payload.position,
                "linkedin_url": payload.linkedin_url,
                "cv_url": payload.cv_url,
                "experience_years": payload.experience_years,
                "updated_at": datetime.now(timezone.utc),
            }
        )
        self._records[record_id] = updated
        return updated

    def patch_status_or_stage(self, record_id: str, payload: RecordPatchPayload) -> Record:
        record = self.get_record(record_id)
        updates: dict = {"updated_at": datetime.now(timezone.utc)}
        if payload.status is not None:
            updates["status"] = payload.status
        if payload.stage is not None:
            updates["stage"] = payload.stage

        updated = record.model_copy(update=updates)
        self._records[record_id] = updated
        return updated

    def list_notes(self, record_id: str) -> List[Note]:
        self.get_record(record_id)
        return sorted(self._notes[record_id], key=lambda n: n.created_at)

    def create_note(self, record_id: str, content: str) -> Note:
        record = self.get_record(record_id)
        note = Note(
            id=str(uuid.uuid4()),
            record_id=record_id,
            content=content,
            created_at=datetime.now(timezone.utc),
        )
        self._notes[record_id].append(note)
        self._records[record_id] = record.model_copy(
            update={"notes_count": record.notes_count + 1}
        )
        return note

    def delete_note(self, record_id: str, note_id: str) -> None:
        self.get_record(record_id)
        notes = self._notes[record_id]
        remaining = [note for note in notes if note.id != note_id]
        if len(remaining) == len(notes):
            raise NoteNotFoundError(f"No existe la nota {note_id}.")

        self._notes[record_id] = remaining
        record = self._records[record_id]
        self._records[record_id] = record.model_copy(
            update={"notes_count": max(0, record.notes_count - 1)}
        )


# Instancia compartida por el proceso: los datos se pierden al reiniciar el backend.
records_service = RecordsService()
