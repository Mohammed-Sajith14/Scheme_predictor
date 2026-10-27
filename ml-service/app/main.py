import onnxruntime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pickle
import os
import logging
from app.train_model import train_and_save_model
from app.rag_engine import index_scheme_document, generate_rag_response, delete_scheme_document, get_rag_status_info, debug_rag

# Configure logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SchemeWise ML & RAG Service")

class DebugRequest(BaseModel):
    question: str
    scheme_id: Optional[int] = None

@app.post("/rag/debug")
def debug_rag_endpoint(payload: DebugRequest):
    try:
        return debug_rag(query=payload.question, scheme_id_context=payload.scheme_id)
    except Exception as e:
        logger.error(f"RAG Debug failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ML model
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')
model = None

def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        logger.info("ML model.pkl not found. Training default model...")
        try:
            train_and_save_model()
        except Exception as e:
            logger.error(f"Failed to auto-train model: {e}")
            return
            
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            logger.info("ML model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model.pkl: {e}")

@app.on_event("startup")
def startup_event():
    load_model()

# Schemas
class PredictRequest(BaseModel):
    age: Optional[int] = None
    income: Optional[float] = None
    student_status: Optional[str] = None
    farmer_status: Optional[str] = None
    disability_status: Optional[str] = None
    coverage: float
    rule_match: float
    total_requirements: int

class SchemeDoc(BaseModel):
    id: int
    name: str
    department: str
    description: str
    benefits: str
    eligibilityCriteria: Optional[str] = ""
    applicationProcess: str
    requiredDocuments: str
    beneficiaryType: Optional[str] = ""
    state: Optional[str] = ""
    deadline: Optional[str] = ""
    officialUrl: Optional[str] = ""
    sources: Optional[List[Dict[str, Any]]] = None
    faqs: Optional[List[Dict[str, Any]]] = None

class IndexRequest(BaseModel):
    schemes: List[SchemeDoc]

class ChatRequest(BaseModel):
    message: str
    session_id: int
    scheme_id: Optional[int] = None
    citizen_wallet: Optional[Dict[str, Any]] = None

@app.post("/predict")
def predict_eligibility(payload: PredictRequest):
    global model
    if model is None:
        load_model()
        if model is None:
            raise HTTPException(status_code=500, detail="ML model is currently unavailable.")
            
    # Process categorical variables to 0/1 matching the model training features
    student_val = 1 if payload.student_status and payload.student_status.lower() in ["yes", "y", "true"] else 0
    farmer_val = 1 if payload.farmer_status and payload.farmer_status.lower() in ["yes", "y", "true"] else 0
    disability_val = 1 if payload.disability_status and payload.disability_status.lower() in ["yes", "y", "true"] else 0
    
    # Fill in missing values with defaults for the model
    age_val = payload.age if payload.age is not None else 35
    income_val = payload.income if payload.income is not None else 180000.0
    
    # Feature columns matching training:
    # ['age', 'income', 'student_status', 'farmer_status', 'disability_status', 'coverage', 'rule_match', 'total_requirements']
    features = [[
        age_val,
        income_val,
        student_val,
        farmer_val,
        disability_val,
        payload.coverage,
        payload.rule_match,
        payload.total_requirements
    ]]
    
    try:
        score = model.predict(features)[0]
        # Return probability as a percentage float between 0.0 and 1.0
        return {"eligibility_score": float(score)}
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train")
def train_model():
    try:
        model_path = train_and_save_model()
        load_model()
        return {"status": "success", "message": f"Model trained and saved to {model_path}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import UploadFile, File
import pypdf
import io

class SingleSourceIndexRequest(BaseModel):
    scheme_id: int
    scheme_name: str
    source_id: int
    source_title: str
    source_type: str
    text: str
    is_published: bool = True

@app.post("/rag/extract-pdf")
async def extract_pdf_endpoint(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF files are supported.")
    
    try:
        content = await file.read()
        if not content.startswith(b"%PDF"):
            raise HTTPException(status_code=400, detail="Corrupted or invalid PDF file header.")
        
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 20MB limit.")
            
        reader = pypdf.PdfReader(io.BytesIO(content))
        if len(reader.pages) == 0:
            raise HTTPException(status_code=400, detail="The PDF contains no pages.")
            
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            p_text = page.extract_text()
            if p_text:
                extracted_pages.append(p_text.strip())
                
        full_text = "\n\n".join(extracted_pages).strip()
        if len(full_text) < 10:
            raise HTTPException(
                status_code=400, 
                detail="The uploaded PDF contains no extractable text. Scanned or image-only PDFs without OCR are not supported."
            )
            
        return {
            "status": "success",
            "pageCount": len(reader.pages),
            "charCount": len(full_text),
            "text": full_text
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract PDF: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")

@app.post("/rag/index-source")
def index_source_endpoint(payload: SingleSourceIndexRequest):
    try:
        from app.rag_engine import index_single_source
        res = index_single_source(
            scheme_id=payload.scheme_id,
            scheme_name=payload.scheme_name,
            source_id=payload.source_id,
            source_title=payload.source_title,
            source_type=payload.source_type,
            text=payload.text,
            is_published=payload.is_published
        )
        return res
    except Exception as e:
        logger.error(f"Single source indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rag/source/{scheme_id}/{source_id}")
def delete_source_endpoint(scheme_id: int, source_id: int):
    try:
        from app.rag_engine import delete_single_source
        delete_single_source(scheme_id=scheme_id, source_id=source_id)
        return {"status": "success", "message": f"Source {source_id} removed from RAG index."}
    except Exception as e:
        logger.error(f"Source deletion from RAG failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/source/{source_id}/chunks")
def get_source_chunks_endpoint(source_id: int):
    try:
        from app.rag_engine import get_source_chunks
        chunks = get_source_chunks(source_id)
        return {"sourceId": source_id, "chunkCount": len(chunks), "chunks": chunks}
    except Exception as e:
        logger.error(f"Fetching source chunks failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/index")
def index_documents(payload: IndexRequest):
    try:
        for s in payload.schemes:
            criteria = s.eligibilityCriteria if s.eligibilityCriteria else "Income limits, age bounds and socio-demographics apply."
            index_scheme_document(
                scheme_id=s.id,
                name=s.name,
                dept=s.department,
                desc=s.description,
                benefits=s.benefits,
                criteria=criteria,
                process=s.applicationProcess,
                docs=s.requiredDocuments,
                beneficiary_type=s.beneficiaryType,
                state=s.state,
                deadline=s.deadline,
                official_url=s.officialUrl,
                sources=s.sources,
                faqs=s.faqs
            )
        return {"status": "success", "indexed_count": len(payload.schemes)}
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/scheme/{scheme_id}/chunks")
def get_chunks_for_scheme(scheme_id: int):
    try:
        from app.rag_engine import get_scheme_chunks
        chunks = get_scheme_chunks(scheme_id)
        return {"schemeId": scheme_id, "chunkCount": len(chunks), "chunks": chunks}
    except Exception as e:
        logger.error(f"Fetching scheme chunks failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rag/delete/{scheme_id}")
def delete_document(scheme_id: int):
    try:
        delete_scheme_document(scheme_id)
        return {"status": "success", "message": f"Scheme ID {scheme_id} removed from index."}
    except Exception as e:
        logger.error(f"Deletion from RAG failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/status")
def get_status():
    return get_rag_status_info()

@app.post("/rag/chat")
def chat_rag(payload: ChatRequest):
    try:
        reply = generate_rag_response(
            query=payload.message,
            session_id=payload.session_id,
            scheme_id_context=payload.scheme_id,
            citizen_wallet=payload.citizen_wallet
        )
        return {"response": reply}
    except Exception as e:
        logger.error(f"RAG chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
