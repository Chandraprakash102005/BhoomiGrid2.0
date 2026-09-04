from fastapi import APIRouter

from schemas import HarmonizeRequest, HarmonizeResponse

router = APIRouter(prefix="/api/v1", tags=["harmonization"])


@router.post("/harmonize", response_model=HarmonizeResponse)
def harmonize_record(payload: HarmonizeRequest) -> HarmonizeResponse:
    standard_record = {
        "jurisdiction": {
            "state": payload.state,
            "district": payload.district,
            "taluka": payload.taluka,
            "village": payload.village,
        },
        "parcel": {
            "gutNumber": payload.gut_number,
            "areaHectares": payload.area_hectares,
            "zoning": payload.zoning,
        },
        "rightsHolders": [{"name": holder, "role": "holder"} for holder in payload.holders],
        "sourceSystem": "Maharashtra Revenue Department",
    }
    return HarmonizeResponse(
        schema_version="National Land Stack v1.0",
        ulpin=None,
        standard_record=standard_record,
    )
