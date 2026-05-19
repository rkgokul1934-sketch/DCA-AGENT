# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from chromadb.utils import embedding_functions
# pyrefly: ignore [missing-import]
from typing import Dict, Any, List, Optional
import json
import logging

logger = logging.getLogger(__name__)

class AgentMemory:
    """
    Long-term memory for the AI Agent using ChromaDB.
    Stores and retrieves historical company intelligence.
    """
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="competitor_intelligence",
            embedding_function=self.embedding_fn
        )

    async def store_analysis(self, company_name: str, data: Dict[str, Any]):
        """
        Stores analysis results in vector memory.
        """
        try:
            # We store the JSON string as metadata and a summary as the document for semantic search
            summary = data.get("market_positioning", f"Intelligence report for {company_name}")
            self.collection.add(
                ids=[company_name.lower()],
                documents=[summary],
                metadatas=[{"json_data": json.dumps(data)}]
            )
            logger.info(f"Stored {company_name} in Agent Memory")
        except Exception as e:
            logger.error(f"Failed to store memory for {company_name}: {e}")

    async def search_memory(self, query: str, limit: int = 1) -> List[Dict[str, Any]]:
        """
        Semantic search across historical intelligence.
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=limit
            )
            
            extracted_data = []
            if results["metadatas"] and results["metadatas"][0]:
                for metadata in results["metadatas"][0]:
                    extracted_data.append(json.loads(metadata["json_data"]))
            
            return extracted_data
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return []

    async def get_company_by_name(self, company_name: str) -> Optional[Dict[str, Any]]:
        """
        Direct retrieval by company name.
        """
        try:
            result = self.collection.get(ids=[company_name.lower()])
            if result["metadatas"]:
                return json.loads(result["metadatas"][0]["json_data"])
            return None
        except Exception:
            return None

agent_memory = AgentMemory()
