import requests

def main():
    try:
        # Fetch seeded schemes from Spring Boot
        response = requests.get("http://localhost:8080/api/schemes/public")
        response.raise_for_status()
        schemes = response.json()
        
        # Prepare payload matching FastAPI SchemeDoc schema
        # SchemeDoc expects: id, name, department, description, benefits, eligibilityCriteria, applicationProcess, requiredDocuments
        index_payload = []
        for s in schemes:
            index_payload.append({
                "id": s["id"],
                "name": s["name"],
                "department": s["department"],
                "description": s["description"],
                "benefits": s["benefits"],
                "eligibilityCriteria": s.get("eligibilityCriteria", "Socio-demographics apply"),
                "applicationProcess": s["applicationProcess"],
                "requiredDocuments": s["requiredDocuments"],
                "beneficiaryType": s.get("beneficiaryType", ""),
                "state": s.get("state", ""),
                "deadline": s.get("deadline", ""),
                "officialUrl": s.get("officialUrl", "")
            })
            
        # Post to FastAPI RAG indexer
        index_response = requests.post(
            "http://localhost:8001/rag/index",
            json={"schemes": index_payload}
        )
        index_response.raise_for_status()
        print(f"Successfully indexed {len(index_payload)} schemes in RAG index.")
        
    except Exception as e:
        print(f"Error during RAG indexing: {e}")

if __name__ == "__main__":
    main()
