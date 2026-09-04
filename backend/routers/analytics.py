from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import LandParcel

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

RATE_PER_HECTARE = {"Residential": 24_000_000, "Mixed Use": 18_000_000, "Agricultural": 7_500_000}


@router.get("/valuation/{ulpin}")
def valuation(ulpin: str, db: Session = Depends(get_db)) -> dict:
    parcel = db.scalar(select(LandParcel).where(LandParcel.ulpin == ulpin))
    if parcel is None:
        raise HTTPException(status_code=404, detail="ULPIN not found")
    area = float(parcel.satbara.area_hectares) if parcel.satbara else 0
    rate = RATE_PER_HECTARE.get(parcel.zoning, 10_000_000)
    base_value = area * rate
    return {
        "ulpin": ulpin,
        "currency": "INR",
        "area_hectares": area,
        "zoning": parcel.zoning,
        "proximity_factor": 1.1,
        "estimated_value": round(base_value * 1.1),
        "methodology": "Mock benchmark rate adjusted by Pune urban proximity factor.",
    }
