from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AssetAccount
from app.schemas.schemas import AssetCreate, AssetOut

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=list[AssetOut])
def list_assets(db: Session = Depends(get_db)):
    return db.query(AssetAccount).order_by(AssetAccount.priority).all()


@router.post("", response_model=AssetOut)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)):
    item = AssetAccount(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, payload: AssetCreate, db: Session = Depends(get_db)):
    item = db.query(AssetAccount).filter(AssetAccount.id == asset_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    item = db.query(AssetAccount).filter(AssetAccount.id == asset_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}
