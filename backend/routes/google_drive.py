"""Google Drive file import routes"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from database import db, logger
from datetime import datetime, timezone
import os
import uuid

router = APIRouter(prefix="/api")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")


@router.get("/drive/status")
async def drive_status():
    """Check if Google Drive integration is configured"""
    return {"configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}


@router.get("/drive/connect")
async def connect_drive(redirect_url: str = ""):
    """Initiate Google Drive OAuth flow"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google Drive integration not configured. Admin needs to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    try:
        from google_auth_oauthlib.flow import Flow
        callback_url = f"{redirect_url.rstrip('/')}/api/drive/callback" if redirect_url else ""
        if not callback_url:
            raise HTTPException(status_code=400, detail="redirect_url required")
        flow = Flow.from_client_config(
            {"web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [callback_url],
            }},
            scopes=["https://www.googleapis.com/auth/drive.readonly"],
            redirect_uri=callback_url,
        )
        auth_url, state = flow.authorization_url(access_type="offline", include_granted_scopes="true", prompt="consent")
        return {"authorization_url": auth_url, "state": state}
    except Exception as e:
        logger.error(f"Drive connect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drive/callback")
async def drive_callback(code: str = Query(...), state: str = Query("")):
    """Handle Google Drive OAuth callback"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Not configured")
    try:
        from google_auth_oauthlib.flow import Flow
        frontend_url = FRONTEND_URL or "/"
        flow = Flow.from_client_config(
            {"web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }},
            scopes=None,
            redirect_uri=f"{frontend_url.rstrip('/')}/api/drive/callback",
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials
        # Store temp credentials
        token_id = f"drive_{uuid.uuid4().hex[:12]}"
        await db.drive_tokens.insert_one({
            "token_id": token_id,
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return RedirectResponse(url=f"{frontend_url}/resume-optimizer?drive_token={token_id}")
    except Exception as e:
        logger.error(f"Drive callback error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/drive/list-files")
async def list_drive_files(data: dict):
    """List PDF/DOCX files from user's Google Drive"""
    token_id = data.get("token_id")
    if not token_id:
        raise HTTPException(status_code=400, detail="token_id required")
    token_doc = await db.drive_tokens.find_one({"token_id": token_id}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Token not found or expired")
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(token=token_doc["access_token"])
        service = build("drive", "v3", credentials=creds)
        results = service.files().list(
            q="(mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document') and trashed=false",
            spaces="drive",
            fields="files(id, name, mimeType, modifiedTime, size)",
            pageSize=20,
            orderBy="modifiedTime desc",
        ).execute()
        files = results.get("files", [])
        return {"files": files}
    except Exception as e:
        logger.error(f"Drive list error: {e}")
        raise HTTPException(status_code=500, detail="Could not list files from Drive")


@router.post("/drive/import-file")
async def import_drive_file(data: dict):
    """Import a file from Google Drive and process it as a resume upload"""
    token_id = data.get("token_id")
    file_id = data.get("file_id")
    file_name = data.get("file_name", "resume.pdf")
    if not token_id or not file_id:
        raise HTTPException(status_code=400, detail="token_id and file_id required")
    token_doc = await db.drive_tokens.find_one({"token_id": token_id}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Token expired")
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        import io
        creds = Credentials(token=token_doc["access_token"])
        service = build("drive", "v3", credentials=creds)
        request = service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        file_bytes = buffer.getvalue()
        ext = file_name.lower().split(".")[-1] if "." in file_name else "pdf"
        if ext == "pdf":
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "".join(page.get_text() for page in doc)[:8000]
            doc.close()
        elif ext == "docx":
            from docx import Document as DocxDocument
            doc = DocxDocument(io.BytesIO(file_bytes))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())[:8000]
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract enough text")
        resume_id = f"resume_{uuid.uuid4().hex[:12]}"
        await db.resume_uploads.insert_one({
            "resume_id": resume_id,
            "filename": file_name,
            "text": text,
            "source": "google_drive",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"resume_id": resume_id, "text_preview": text[:500], "word_count": len(text.split()), "filename": file_name}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drive import error: {e}")
        raise HTTPException(status_code=500, detail="Could not import file from Drive")
