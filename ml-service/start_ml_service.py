import os
import sys
import traceback

ml_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ml_dir)

log_path = os.path.join(ml_dir, "service_run.log")
log_f = open(log_path, "a", encoding="utf-8")
sys.stdout = log_f
sys.stderr = log_f

try:
    print(f"\n--- Launching ML Service PID {os.getpid()} ---")
    import uvicorn
    from app.main import app
    print("FastAPI app imported successfully.")
    
    # Configure uvicorn
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        http="h11",
        log_level="info"
    )
    server = uvicorn.Server(config)
    print("Server starting run loop...")
    server.run()
except Exception as e:
    traceback.print_exc(file=log_f)
finally:
    print("Server run loop finished.")
    log_f.flush()
