{
  "AI Routing Audit Findings":
  {
    "Vision Analysis": {
      "Actual Model": "qwen3.7-plus",
      "Runtime Value": "qwen3.7-plus",
      "Configuration Source": ".env.example:AI_VISION_MODEL"
    },
    "Recommendation Generation": {
      "Actual Model": "gpt-5.6-luna",
      "Runtime Value": "gpt-5.6-luna",
      "Configuration Source": ".env.example:AI_RECOMMENDATION_MODEL"
    },
    "General Generation": {
      "Actual Model": "deepseek-v4-flash",
      "Runtime Value": "deepseek-v4-flash",
      "Configuration Source": ".env.example:AI_MODEL"
    },
    "Embeddings": {
      "Actual Model": "jina-embeddings-v4",
      "Runtime Value": "jina-embeddings-v4",
      "Configuration Source": ".env.example:JINA_EMBEDDING_MODEL",
      "Dimensions": "1536",
      "Dimension Source": "Jina model properties"
    },
    "Content Embedding": {
      "Actual Model": "text-embedding-3-small",
      "Runtime Value": "text-embedding-3-small",
      "Configuration Source": ".env.example:AI_EMBEDDING_MODEL"
    }
  }
}