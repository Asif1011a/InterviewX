from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz  # pymupdf

router = APIRouter(prefix="/resume", tags=["resume"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")
    contents = await file.read()
    try:
        doc = fitz.open(stream=contents, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
    except Exception as e:
        raise HTTPException(500, f"Failed to parse PDF: {str(e)}")
    if not text.strip():
        raise HTTPException(400, "Could not extract text from PDF. Try a text-based PDF.")
    return {"resume_text": text.strip()}
