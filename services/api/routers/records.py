from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from services.api.schemas.records import (
    Note,
    NotePayload,
    NotesResponse,
    NotesResponseMeta,
    Record,
    RecordPatchPayload,
    RecordPayload,
    RecordsResponse,
)
from services.api.services.records_service import (
    NoteNotFoundError,
    RecordNotFoundError,
    records_service,
)

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=RecordsResponse)
def list_records() -> RecordsResponse:
    records = records_service.list_records()
    return RecordsResponse(total=len(records), page=1, limit=len(records) or 1, data=records)


@router.get("/{record_id}", response_model=Record)
def get_record(record_id: str) -> Record:
    try:
        return records_service.get_record(record_id)
    except RecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=Record, status_code=status.HTTP_201_CREATED)
def create_record(payload: RecordPayload) -> Record:
    return records_service.create_record(payload)


@router.put("/{record_id}", response_model=Record)
def update_record(record_id: str, payload: RecordPayload) -> Record:
    try:
        return records_service.update_record(record_id, payload)
    except RecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{record_id}", response_model=Record)
def patch_record(record_id: str, payload: RecordPatchPayload) -> Record:
    try:
        return records_service.patch_status_or_stage(record_id, payload)
    except RecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{record_id}/notes", response_model=NotesResponse)
def list_notes(record_id: str) -> NotesResponse:
    try:
        notes = records_service.list_notes(record_id)
    except RecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return NotesResponse(data=notes, meta=NotesResponseMeta(total=len(notes)))


@router.post("/{record_id}/notes", response_model=Note, status_code=status.HTTP_201_CREATED)
def create_note(record_id: str, payload: NotePayload) -> Note:
    try:
        return records_service.create_note(record_id, payload.content)
    except RecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{record_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(record_id: str, note_id: str) -> None:
    try:
        records_service.delete_note(record_id, note_id)
    except (RecordNotFoundError, NoteNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
