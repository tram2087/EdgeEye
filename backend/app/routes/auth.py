from fastapi import APIRouter, HTTPException, Depends
from backend.app import schemas

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.UserResponse)
def login(credentials: schemas.UserLogin):
    # Demo Credentials validation
    if credentials.username == "operator" and credentials.password == "demo123":
        return {
            "id": 1,
            "username": "operator",
            "role": "SECURITY_OPERATOR",
            "token": "demo-jwt-token-edgeeye-operator"
        }
    elif credentials.username == "admin" and credentials.password == "admin123":
        return {
            "id": 2,
            "username": "admin",
            "role": "SYSTEM_ADMIN",
            "token": "demo-jwt-admin-token-edgeeye"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password. Demo operator login: operator / demo123")

@router.get("/me")
def get_current_user():
    return {
        "id": 1,
        "username": "operator",
        "role": "SECURITY_OPERATOR",
        "station": "Sector Command Center Alpha",
        "session_active": True
    }
