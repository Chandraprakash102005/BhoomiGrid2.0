from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import LandParcel
from schemas import ParcelDetails

router = APIRouter(prefix="/api/v1/parcels", tags=["parcels"])


def parcel_feature(parcel: LandParcel) -> dict:
    geometry = to_shape(parcel.geom)
    properties = {
        "ulpin": parcel.ulpin,
        "district": parcel.district,
        "taluka": parcel.taluka,
        "village": parcel.village,
        "gut_number": parcel.gut_number,
        "zoning": parcel.zoning,
    }
    return {
        "type": "Feature",
        "id": parcel.ulpin,
        "geometry": {"type": geometry.geom_type, "coordinates": list(geometry.exterior.coords)},
        "properties": properties,
    }


@router.get("/")
def list_parcels(db: Session = Depends(get_db)) -> dict:
    parcels = db.scalars(select(LandParcel).order_by(LandParcel.gut_number)).all()
    return {"type": "FeatureCollection", "features": [parcel_feature(p) for p in parcels]}


@router.get("/{ulpin}", response_model=ParcelDetails)
def get_parcel(ulpin: str, db: Session = Depends(get_db)) -> ParcelDetails:
    parcel = db.scalar(
        select(LandParcel)
        .options(selectinload(LandParcel.satbara), selectinload(LandParcel.mutations))
        .where(LandParcel.ulpin == ulpin)
    )
    if parcel is None:
        raise HTTPException(status_code=404, detail="ULPIN not found")
    return ParcelDetails(
        ulpin=parcel.ulpin,
        district=parcel.district,
        taluka=parcel.taluka,
        village=parcel.village,
        gut_number=parcel.gut_number,
        zoning=parcel.zoning,
        satbara=parcel.satbara,
        mutations=parcel.mutations,
    )
