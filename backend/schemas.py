from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HarmonizeRequest(BaseModel):
    state: str = "Maharashtra"
    district: str
    taluka: str
    village: str
    gut_number: str
    area_hectares: float = Field(gt=0)
    holders: list[str] = Field(min_length=1)
    zoning: str = "Residential"


class HarmonizeResponse(BaseModel):
    schema_version: str
    ulpin: str | None
    standard_record: dict[str, Any]


class MutationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entry_number: str
    entry_date: str
    mutation_type: str
    remarks: str


class SatbaraResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    khata_number: str
    holders: list[str]
    area_hectares: float
    encumbrance_details: str


class ParcelProperties(BaseModel):
    ulpin: str
    district: str
    taluka: str
    village: str
    village_marathi: str | None = None
    gut_number: str
    zoning: str


class ParcelDetails(ParcelProperties):
    model_config = ConfigDict(from_attributes=True)

    satbara: SatbaraResponse | None = None
    mutations: list[MutationResponse]
