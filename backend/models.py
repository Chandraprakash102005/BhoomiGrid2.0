from sqlalchemy import ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from database import Base


class LandParcel(Base):
    __tablename__ = "land_parcels"

    ulpin: Mapped[str] = mapped_column(String(14), primary_key=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    taluka: Mapped[str] = mapped_column(String(100), nullable=False)
    village: Mapped[str] = mapped_column(String(100), nullable=False)
    gut_number: Mapped[str] = mapped_column(String(50), nullable=False)
    zoning: Mapped[str] = mapped_column(String(50), nullable=False, default="Residential")
    geom = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=False)

    satbara: Mapped["SatbaraExtract | None"] = relationship(
        back_populates="parcel", cascade="all, delete-orphan", uselist=False
    )
    mutations: Mapped[list["MutationEntry"]] = relationship(
        back_populates="parcel", cascade="all, delete-orphan"
    )


class SatbaraExtract(Base):
    __tablename__ = "satbara_extracts"

    ulpin: Mapped[str] = mapped_column(
        ForeignKey("land_parcels.ulpin", ondelete="CASCADE"), primary_key=True
    )
    khata_number: Mapped[str] = mapped_column(String(50), nullable=False)
    holders: Mapped[list] = mapped_column(JSON, nullable=False)
    area_hectares: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    encumbrance_details: Mapped[str] = mapped_column(Text, nullable=False)
    parcel: Mapped[LandParcel] = relationship(back_populates="satbara")


class MutationEntry(Base):
    __tablename__ = "mutation_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ulpin: Mapped[str] = mapped_column(
        ForeignKey("land_parcels.ulpin", ondelete="CASCADE"), nullable=False
    )
    entry_number: Mapped[str] = mapped_column(String(50), nullable=False)
    entry_date: Mapped[str] = mapped_column(String(10), nullable=False)
    mutation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    remarks: Mapped[str] = mapped_column(Text, nullable=False)
    parcel: Mapped[LandParcel] = relationship(back_populates="mutations")
