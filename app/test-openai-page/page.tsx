"use client"

import { useState } from 'react'

export default function TestOpenAIPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testOpenAI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-openai')
      const data = await response.json()
      
      if (data.error) {
        setError(data.error + (data.details ? `: ${data.details}` : ''))
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(`Error testing OpenAI: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">OpenAI API Test</h1>
      
      <button 
        onClick={testOpenAI}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        {loading ? "Testing..." : "Test OpenAI API Connection"}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-bold">Success!</p>
            <p>{result.message}</p>
          </div>
          
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Raw API Response:</h2>
            <pre className="mt-2 p-3 bg-gray-100 overflow-auto text-sm rounded">
              {JSON.stringify(result.raw_response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 