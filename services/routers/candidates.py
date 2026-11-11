from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlmodel import Session, select

from services.database import get_db
from services.models import Candidate, CandidateNote
from services.schemas import (
    CandidateCreate,
    CandidatePatch,
    CandidateResponse,
    NoteCreate,
    NoteResponse,
    NotesMeta,
    NotesResponse,
    RecordsResponse,
)

router = APIRouter(tags=["candidates"])


def _get_candidate(session: Session, candidate_id: str) -> Candidate:
    candidate = session.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidato no encontrado.")
    return candidate


def _candidate_response(session: Session, candidate: Candidate) -> CandidateResponse:
    notes_count = session.exec(
        select(func.count()).select_from(CandidateNote).where(
            CandidateNote.record_id == candidate.id
        )
    ).one()
    return CandidateResponse(**candidate.model_dump(), notes_count=notes_count)


def seed_candidates(session: Session, records: list[CandidateResponse]) -> None:
    if session.exec(select(Candidate.id).limit(1)).first() is not None:
        return
    for record in records:
        session.add(Candidate.model_validate(record.model_dump(exclude={"notes_count"})))
    session.commit()


@router.get("", response_model=RecordsResponse)
def list_candidates(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=1000),
    session: Session = Depends(get_db),
) -> RecordsResponse:
    total = session.exec(select(func.count()).select_from(Candidate)).one()
    candidates = session.exec(
        select(Candidate).order_by(Candidate.applied_at.desc(), Candidate.id)
        .offset((page - 1) * limit).limit(limit)
    ).all()
    return RecordsResponse(
        total=total, page=page, limit=limit,
        data=[_candidate_response(session, candidate) for candidate in candidates],
    )


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    payload: CandidateCreate, session: Session = Depends(get_db)
) -> CandidateResponse:
    candidate = Candidate.model_validate(payload.model_dump(mode="json"))
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return _candidate_response(session, candidate)


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: str, session: Session = Depends(get_db)
) -> CandidateResponse:
    return _candidate_response(session, _get_candidate(session, candidate_id))


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: str, payload: CandidateCreate, session: Session = Depends(get_db)
) -> CandidateResponse:
    candidate = _get_candidate(session, candidate_id)
    candidate.sqlmodel_update(payload.model_dump(mode="json"))
    candidate.updated_at = datetime.now(timezone.utc)
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return _candidate_response(session, candidate)


@router.patch("/{candidate_id}", response_model=CandidateResponse)
def patch_candidate(
    candidate_id: str, payload: CandidatePatch, session: Session = Depends(get_db)
) -> CandidateResponse:
    candidate = _get_candidate(session, candidate_id)
    candidate.sqlmodel_update(payload.model_dump(exclude_none=True))
    candidate.updated_at = datetime.now(timezone.utc)
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return _candidate_response(session, candidate)


@router.get("/{candidate_id}/notes", response_model=NotesResponse)
def list_notes(
    candidate_id: str, session: Session = Depends(get_db)
) -> NotesResponse:
    _get_candidate(session, candidate_id)
    notes = session.exec(
        select(CandidateNote).where(CandidateNote.record_id == candidate_id)
        .order_by(CandidateNote.created_at.desc(), CandidateNote.id)
    ).all()
    return NotesResponse(
        data=[NoteResponse.model_validate(note) for note in notes],
        meta=NotesMeta(total=len(notes)),
    )


@router.post(
    "/{candidate_id}/notes", response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    candidate_id: str, payload: NoteCreate, session: Session = Depends(get_db)
) -> CandidateNote:
    candidate = _get_candidate(session, candidate_id)
    note = CandidateNote(record_id=candidate_id, content=payload.content)
    candidate.updated_at = datetime.now(timezone.utc)
    session.add(candidate)
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@router.delete("/{candidate_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    candidate_id: str, note_id: str, session: Session = Depends(get_db)
) -> Response:
    candidate = _get_candidate(session, candidate_id)
    note = session.get(CandidateNote, note_id)
    if note is None or note.record_id != candidate_id:
        raise HTTPException(status_code=404, detail="Nota no encontrada.")
    candidate.updated_at = datetime.now(timezone.utc)
    session.add(candidate)
    session.delete(note)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)