# BhoomiGrid2.0

Containerized GIS prototype for Maharashtra land governance, centered on ULPIN, Gut numbers, 7/12 Satbara extracts, and Ferfar mutation records.

## Run

1. Copy `.env.example` to `.env` and change the database password for shared deployments.
2. Run `docker compose up --build`.
3. Open the [GIS viewer](http://localhost:3000/map), API docs at [localhost:8000/docs](http://localhost:8000/docs), or health at [localhost:8000/health](http://localhost:8000/health).

The database initializes PostGIS on first startup. The backend creates its tables and seeds three Akurdi, Pune parcels when the database is empty.

## API

- `GET /api/v1/parcels/` - GeoJSON FeatureCollection
- `GET /api/v1/parcels/{ulpin}` - parcel, Satbara, and Ferfar details
- `POST /api/v1/harmonize` - normalizes a Maharashtra revenue record
- `GET /api/v1/analytics/valuation/{ulpin}` - mock valuation estimate
