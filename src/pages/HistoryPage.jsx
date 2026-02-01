import { useState, useEffect } from 'react'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [expandedIndex, setExpandedIndex] = useState(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      setHistory(savedHistory)
    } catch (error) {
      console.error('Error loading history:', error)
      setHistory([])
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.setItem('triageHistory', '[]')
      setHistory([])
    }
  }

  const sortedHistory = [...history].sort((a, b) => 
    a.message.localeCompare(b.message)
  )
  
  const filteredHistory = sortedHistory.filter(item => {
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter
    const urgencyMatch = urgencyFilter === 'all' || item.urgency === urgencyFilter
    return categoryMatch && urgencyMatch
  })

  const categories = [...new Set(history.map(item => item.category).filter(Boolean))]
  const urgencies = ['High', 'Medium', 'Low']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
              <p className="text-gray-600">View and manage past message analyses</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          {history.length > 0 && (
            <div className="space-y-4 mb-6">
              {/* Category Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Category:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      categoryFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories ({history.length})
                  </button>
                  {categories.map(category => {
                    const count = history.filter(h => h.category === category).length
                    return (
                      <button
                        key={category}
                        onClick={() => setCategoryFilter(category)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          categoryFilter === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Urgency Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Urgency:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setUrgencyFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      urgencyFilter === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Urgencies ({history.length})
                  </button>
                  {urgencies.map(urgency => {
                    const count = history.filter(h => h.urgency === urgency).length
                    return (
                      <button
                        key={urgency}
                        onClick={() => setUrgencyFilter(urgency)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          urgencyFilter === urgency
                            ? urgency === 'High' ? 'bg-red-600 text-white' :
                              urgency === 'Medium' ? 'bg-yellow-600 text-white' :
                              'bg-green-600 text-white'
                            : urgency === 'High' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                              urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                              'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {urgency} Urgency ({count})
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History List */}
        {filteredHistory.length === 0 && history.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-xl text-gray-600 mb-2">No history yet</div>
            <p className="text-gray-500 mb-6">
              Analyzed messages will appear here
            </p>
            <a
              href="/analyze"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Analyze a Message
            </a>
          </div>
        )}

        {filteredHistory.length === 0 && history.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-3xl mb-4">🔍</div>
            <div className="text-xl text-gray-600 mb-2">No results match your filters</div>
            <p className="text-gray-500 mb-6">
              Try adjusting your category or urgency filters
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all')
                setUrgencyFilter('all')
              }}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="text-gray-800 font-medium mb-2">
                      "{item.message.substring(0, 100)}{item.message.length > 100 ? '...' : ''}"
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                        {item.category}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        item.urgency === 'High' ? 'bg-red-200 text-red-900' :
                        item.urgency === 'Medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-green-200 text-green-900'
                      }`}>
                        {item.urgency} Urgency
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 ml-4">
                    {expandedIndex === index ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Full Message</div>
                      <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                        {item.message}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Recommended Action</div>
                      <div className="text-sm text-gray-800 bg-purple-50 p-3 rounded border border-purple-200">
                        {item.recommendedAction}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">AI Reasoning</div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <pre className="whitespace-pre-wrap font-sans">{item.reasoning}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage
