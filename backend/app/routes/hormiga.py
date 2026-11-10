import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.utils import get_current_user
from ..database import get_db
from .. import models, schemas
from ..services import hormiga as svc

router = APIRouter(tags=["Gastos hormiga"])


def _config(db: Session, user: models.User) -> schemas.HormigaConfig:
    threshold, mode, sample = svc.effective_threshold(db, user)
    try:
        excluded = [str(x) for x in json.loads(user.ant_excluded or "[]")]
    except (ValueError, TypeError):
        excluded = []
    return schemas.HormigaConfig(
        threshold=threshold, mode=mode, manual_threshold=user.ant_threshold, sample_size=sample,
        limit=user.ant_limit, notify=bool(user.ant_notify), excluded=excluded,
    )


@router.get("/config", response_model=schemas.HormigaConfig)
def get_config(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Umbral efectivo (automático o manual), tope, si quiere avisos y las compras que excluyó."""
    return _config(db, current_user)


@router.put("/config", response_model=schemas.HormigaConfig)
def update_config(
    payload: schemas.HormigaConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """`threshold: null` vuelve al umbral automático; `limit: null` quita el tope."""
    data = payload.model_dump(exclude_unset=True)
    for field in ("threshold", "limit"):
        value = data.get(field)
        if value is not None and not (0 < value < 1e9):
            raise HTTPException(status_code=422, detail=f"{field} inválido")
    if "threshold" in data:
        current_user.ant_threshold = data["threshold"]
    if "limit" in data:
        current_user.ant_limit = data["limit"]
    if data.get("notify") is not None:
        current_user.ant_notify = data["notify"]
    if data.get("excluded") is not None:
        names = []
        for raw in data["excluded"][:100]:
            key = svc.normalize(raw)
            if key and key not in names:
                names.append(key)
        current_user.ant_excluded = json.dumps(names)
    db.commit()
    db.refresh(current_user)
    return _config(db, current_user)
