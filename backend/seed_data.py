from sqlalchemy import select
from sqlalchemy.orm import Session
from geoalchemy2.shape import from_shape
from shapely.geometry import Polygon

from models import LandParcel, MutationEntry, SatbaraExtract


SEED_PARCELS = [
    {
        "ulpin": "27250100401001",
        "district": "Pune",
        "taluka": "Haveli",
        "village": "Akurdi",
        "gut_number": "142/2",
        "zoning": "Residential",
        "area": 0.82,
        "khata": "KH-142-02",
        "holders": ["श्री. गणेश देशमुख", "Ganesh Deshmukh"],
        "encumbrance": "No registered encumbrance / कोणताही बोजा नाही",
        "polygon": [(73.7790, 18.6500), (73.7802, 18.6500), (73.7802, 18.6510), (73.7790, 18.6510), (73.7790, 18.6500)],
        "mutation": ("FER-2021-0042", "2021-08-17", "वारस नोंद / Inheritance", "Recorded after succession certificate."),
    },
    {
        "ulpin": "27250100401002",
        "district": "Pune",
        "taluka": "Haveli",
        "village": "Akurdi",
        "gut_number": "143/1",
        "zoning": "Agricultural",
        "area": 1.46,
        "khata": "KH-143-01",
        "holders": ["सौ. मंगला पाटील", "Mangala Patil"],
        "encumbrance": "Co-operative bank charge recorded / सहकारी बँकेचा बोजा",
        "polygon": [(73.7810, 18.6496), (73.7826, 18.6496), (73.7826, 18.6508), (73.7810, 18.6508), (73.7810, 18.6496)],
        "mutation": ("FER-2023-0018", "2023-03-09", "कर्ज बोजा / Loan charge", "Charge recorded in favour of Pune District Co-operative Bank."),
    },
    {
        "ulpin": "27250100401003",
        "district": "Pune",
        "taluka": "Haveli",
        "village": "Akurdi",
        "gut_number": "144/3",
        "zoning": "Mixed Use",
        "area": 0.64,
        "khata": "KH-144-03",
        "holders": ["श्री. अमोल जाधव", "Amol Jadhav"],
        "encumbrance": "Clear title as per latest Ferfar / फेरफारनुसार बोजामुक्त",
        "polygon": [(73.7788, 18.6482), (73.7800, 18.6482), (73.7800, 18.6492), (73.7788, 18.6492), (73.7788, 18.6482)],
        "mutation": ("FER-2024-0107", "2024-11-21", "खरेदी विक्री / Sale deed", "Registered sale deed indexed against the ULPIN."),
    },
]


def seed_database(db: Session) -> None:
    if db.scalar(select(LandParcel.ulpin).limit(1)) is not None:
        return

    for item in SEED_PARCELS:
        parcel = LandParcel(
            ulpin=item["ulpin"],
            district=item["district"],
            taluka=item["taluka"],
            village=item["village"],
            gut_number=item["gut_number"],
            zoning=item["zoning"],
            geom=from_shape(Polygon(item["polygon"]), srid=4326),
            satbara=SatbaraExtract(
                ulpin=item["ulpin"],
                khata_number=item["khata"],
                holders=item["holders"],
                area_hectares=item["area"],
                encumbrance_details=item["encumbrance"],
            ),
            mutations=[
                MutationEntry(
                    ulpin=item["ulpin"],
                    entry_number=item["mutation"][0],
                    entry_date=item["mutation"][1],
                    mutation_type=item["mutation"][2],
                    remarks=item["mutation"][3],
                )
            ],
        )
        db.add(parcel)
    db.commit()
