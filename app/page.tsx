'use client'

import { useState, useEffect } from 'react'
import { supabase, AIPolicy } from '@/lib/supabase'
import { ExternalLink, Calendar, AlertTriangle, RefreshCw, Activity, Shield, FileText, Building2, TrendingUp, Database, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [policies, setPolicies] = useState<AIPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [collectionStatus, setCollectionStatus] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    policy_name: 250,
    status: 120,
    jurisdiction: 150,
    issuing_body: 200,
    date_introduced: 120,
    date_enacted: 120,
    policy_type: 150,
    scope_coverage: 200,
    key_provisions: 300,
    risk_classification: 120,
    company_obligations: 200,
    penalties_fines: 200,
    affected_stakeholders: 200,
    implementation_notes: 200,
    latest_update: 120,
    monitoring_org: 180,
    notes_commentary: 200,
    next_review_date: 120,
    confidence_score: 100,
    created_at: 120,
    updated_at: 120,
    source_reference_link: 150
  })
  const [resizing, setResizing] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    policy_name: true,
    jurisdiction: true,
    issuing_body: true,
    date_introduced: false,
    date_enacted: true,
    status: true,
    policy_type: false,
    scope_coverage: true,
    key_provisions: true,
    risk_classification: true,
    company_obligations: false,
    penalties_fines: false,
    affected_stakeholders: true,
    implementation_notes: true,
    latest_update: false,
    monitoring_org: false,
    notes_commentary: true,
    next_review_date: false,
    confidence_score: true,
    created_at: false,
    updated_at: true,
    source_reference_link: true
  })

  useEffect(() => {
    fetchPolicies()
    fetchCollectionStatus()
  }, [])

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('resizing')
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
  }, [])

  const fetchCollectionStatus = async () => {
    try {
      const response = await fetch('/api/collection-status')
      if (response.ok) {
        const data = await response.json()
        setCollectionStatus(data)
      }
    } catch (error) {
      console.error('Error fetching collection status:', error)
    }
  }

  const triggerManualCollection = async () => {
    if (process.env.NODE_ENV !== 'development') {
      alert('Manual collection is only available in development mode')
      return
    }

    setRefreshing(true)
    try {
      const response = await fetch('/api/collect-policies')
      if (response.ok) {
        await fetchPolicies()
        await fetchCollectionStatus()
        alert('Policy collection completed successfully!')
      } else {
        alert('Collection failed. Check console for details.')
      }
    } catch (error) {
      console.error('Manual collection error:', error)
      alert('Collection failed. Check console for details.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    console.log('Mouse down on column:', columnKey)
    e.preventDefault()
    e.stopPropagation()
    
    setResizing(columnKey)
    
    const startX = e.clientX
    const startWidth = columnWidths[columnKey]
    
    console.log('Start resize:', { startX, startWidth, columnKey })
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(80, Math.min(800, startWidth + deltaX))
      
      console.log('Resizing:', { deltaX, newWidth, columnKey })
      
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }))
    }
    
    const handleMouseUp = () => {
      console.log('Mouse up, stopping resize')
      setResizing(null)
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.body.classList.remove('resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    // Set up global event listeners
    document.body.classList.add('resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('mouseup', handleMouseUp, true)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid Date'
    }
  }

  const truncateText = (text: string | null | undefined, maxLength: number = 100) => {
    if (!text) return 'N/A'
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const formatTextContent = (text: string | null | undefined) => {
    if (!text) return 'N/A'
    
    // Try to parse as JSON first (for existing data that wasn't normalized)
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return (
          <ul className="list-none space-y-1">
            {parsed.filter(item => item && typeof item === 'string').map((item, index) => (
              <li key={index} className="text-sm">
                • {item.trim()}
              </li>
            ))}
          </ul>
        )
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <div className="space-y-1">
            {Object.entries(parsed).map(([key, val], index) => (
              <p key={index} className="text-sm">
                <span className="font-medium">{key}:</span> {String(val)}
              </p>
            ))}
          </div>
        )
      }
    } catch {
      // Not JSON, continue with text formatting
    }
    
    // Check if text contains bullet points (from our normalization)
    if (text.includes('• ')) {
      const items = text.split('\n').filter(line => line.trim())
      return (
        <ul className="list-none space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-sm">
              {item.trim()}
            </li>
          ))}
        </ul>
      )
    }
    
    // Check if text contains multiple sentences/paragraphs
    if (text.includes('\n') && !text.includes('• ')) {
      const paragraphs = text.split('\n').filter(line => line.trim())
      return (
        <div className="space-y-2">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )
    }
    
    // Single line text
    return <span className="text-sm">{text}</span>
  }

  const renderCell = (policy: AIPolicy, columnKey: string) => {
    const baseClasses = "px-3 py-4 text-sm border-r border-gray-200"
    const style = { 
      width: `${columnWidths[columnKey]}px`,
      minWidth: `${columnWidths[columnKey]}px`,
      maxWidth: `${columnWidths[columnKey]}px`
    }
    
    switch (columnKey) {
      case 'policy_name':
        return (
          <td key={columnKey} className={baseClasses} style={style}>
            <div className="font-medium text-gray-900 break-words">
              {policy.policy_name || 'N/A'}
            </div>
          </td>
        )
      case 'status':
        return (
          <td key={columnKey} className={baseClasses} style={style}>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
              {policy.status}
            </span>
          </td>
        )
      case 'risk_classification':
        return (
          <td key={columnKey} className={baseClasses} style={style}>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(policy.risk_classification)}`}>
              {policy.risk_classification === 'Critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {policy.risk_classification}
            </span>
          </td>
        )
      case 'confidence_score':
        const confidence = policy.confidence_score || 0
        const getConfidenceColor = (score: number) => {
          if (score >= 80) return 'bg-green-100 text-green-800'
          if (score >= 60) return 'bg-yellow-100 text-yellow-800'
          if (score >= 40) return 'bg-orange-100 text-orange-800'
          return 'bg-red-100 text-red-800'
        }
        return (
          <td key={columnKey} className={baseClasses} style={style}>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(confidence)}`}>
              {confidence}%
            </span>
          </td>
        )
      case 'source_reference_link':
        return (
          <td key={columnKey} className={baseClasses} style={style}>
            {policy.source_reference_link ? (
              <a
                href={policy.source_reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-900 flex items-center"
                title={policy.source_reference_link}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              'N/A'
            )}
          </td>
        )
      case 'date_introduced':
      case 'date_enacted':
      case 'latest_update':
      case 'next_review_date':
      case 'created_at':
      case 'updated_at':
        return (
          <td key={columnKey} className={`${baseClasses} text-gray-900`} style={style}>
            {formatDate(policy[columnKey as keyof AIPolicy] as string)}
          </td>
        )
      default:
        const value = policy[columnKey as keyof AIPolicy] as string
        // Fields that might contain formatted text (lists, paragraphs)
        const formattedFields = ['key_provisions', 'company_obligations', 'affected_stakeholders', 'penalties_fines', 'implementation_notes', 'notes_commentary', 'scope_coverage']
        
        return (
          <td key={columnKey} className={`${baseClasses} text-gray-900`} style={style}>
            <div className="break-words whitespace-normal">
              {formattedFields.includes(columnKey) ? formatTextContent(value) : (value || 'N/A')}
            </div>
          </td>
        )
    }
  }

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_policies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPolicies(data || [])
    } catch (error) {
      console.error('Error fetching policies:', error)
    } finally {
      setLoading(false)
    }
  }


  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-50 text-red-900 border border-red-200 shadow-sm'
      case 'High': return 'bg-orange-50 text-orange-900 border border-orange-200 shadow-sm'
      case 'Medium': return 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm'
      case 'Low': return 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm'
      default: return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Enacted': return 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm'
      case 'Proposed': return 'bg-blue-50 text-blue-900 border border-blue-200 shadow-sm'
      case 'Under Review': return 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm'
      case 'Amended': return 'bg-purple-50 text-purple-900 border border-purple-200 shadow-sm'
      case 'Repealed': return 'bg-red-50 text-red-900 border border-red-200 shadow-sm'
      case 'Expired': return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
      default: return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Professional Government Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .resizing {
            user-select: none !important;
            cursor: col-resize !important;
          }
          .resizing * {
            cursor: col-resize !important;
          }
          .resize-handle {
            background: transparent;
            border-right: 2px solid transparent;
            transition: all 0.2s ease;
          }
          .resize-handle:hover {
            border-right: 2px solid #3b82f6;
            background: rgba(59, 130, 246, 0.1);
          }
          .resize-handle.active {
            border-right: 2px solid #1e40af;
            background: rgba(30, 64, 175, 0.2);
          }
          .government-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(59, 130, 246, 0.05);
          }
          .government-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(10px);
          }
          .government-header {
            background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          }
        `
      }} />
      {/* Professional Government Header */}
      <div className="government-header shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Government Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Policy Tracker</h1>
                  <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Government Regulatory Intelligence</p>
                </div>
              </div>
            </div>
            
            {/* Status and Controls */}
            <div className="flex items-center space-x-6">
              {collectionStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 font-medium">Live Collection Active</span>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={triggerManualCollection}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 government-shadow"
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Collect Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Policy Intelligence Dashboard</h2>
          <p className="text-slate-600 text-lg">Real-time monitoring of AI regulatory developments from government sources worldwide</p>
        </div>

        {/* Professional Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Policies Card */}
          <div className="government-card government-shadow rounded-xl p-6 transition-all duration-300 hover:shadow-xl group">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-5 flex-1">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Policies</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{policies.length.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Across all jurisdictions</p>
              </div>
            </div>
          </div>

          {/* Enacted Policies Card */}
          <div className="government-card government-shadow rounded-xl p-6 transition-all duration-300 hover:shadow-xl group">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Shield className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-5 flex-1">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Enacted</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{policies.filter(p => p.status === 'Enacted').length.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Active regulations</p>
              </div>
            </div>
          </div>

          {/* Proposed Policies Card */}
          <div className="government-card government-shadow rounded-xl p-6 transition-all duration-300 hover:shadow-xl group">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-5 flex-1">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Proposed</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{policies.filter(p => p.status === 'Proposed').length.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Under consideration</p>
              </div>
            </div>
          </div>

          {/* High Risk Policies Card */}
          <div className="government-card government-shadow rounded-xl p-6 transition-all duration-300 hover:shadow-xl group">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-5 flex-1">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">High Risk</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{policies.filter(p => p.risk_classification === 'High' || p.risk_classification === 'Critical').length.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Critical impact policies</p>
              </div>
            </div>
          </div>
        </div>
        {/* Professional Column Configuration */}
        <div className="mb-8">
          <details className="government-card government-shadow rounded-xl p-6">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-base">Table Configuration</span>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                {Object.values(visibleColumns).filter(Boolean).length}/{Object.keys(visibleColumns).length} columns visible
              </span>
            </summary>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <label key={key} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors duration-200 border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                  />
                  <span className="text-slate-700 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </details>
        </div>

      {/* Resizable Table */}
      <div className="mt-8 flow-root">
        <div className="mb-4 text-sm text-gray-600">
          <p>💡 <strong>Tip:</strong> Hover over column borders and drag to resize columns. Use column visibility controls above to show/hide fields.</p>
        </div>
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300" style={{ tableLayout: 'auto' }}>
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'policy_name', label: 'Policy Name' },
                      { key: 'jurisdiction', label: 'Jurisdiction' },
                      { key: 'issuing_body', label: 'Issuing Body' },
                      { key: 'date_introduced', label: 'Date Introduced' },
                      { key: 'date_enacted', label: 'Date Enacted' },
                      { key: 'status', label: 'Status' },
                      { key: 'policy_type', label: 'Policy Type' },
                      { key: 'scope_coverage', label: 'Scope/Coverage' },
                      { key: 'key_provisions', label: 'Key Provisions' },
                      { key: 'risk_classification', label: 'Risk Level' },
                      { key: 'company_obligations', label: 'Company Obligations' },
                      { key: 'penalties_fines', label: 'Penalties/Fines' },
                      { key: 'affected_stakeholders', label: 'Affected Stakeholders' },
                      { key: 'implementation_notes', label: 'Implementation Notes' },
                      { key: 'latest_update', label: 'Latest Update' },
                      { key: 'monitoring_org', label: 'Monitoring Org' },
                      { key: 'notes_commentary', label: 'Notes/Commentary' },
                      { key: 'next_review_date', label: 'Next Review Date' },
                      { key: 'confidence_score', label: 'Confidence' },
                      { key: 'created_at', label: 'Created' },
                      { key: 'updated_at', label: 'Updated' },
                      { key: 'source_reference_link', label: 'Source Link' }
                    ].filter(column => visibleColumns[column.key]).map((column) => (
                      <th
                        key={column.key}
                        className="relative px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                        style={{ 
                          width: `${columnWidths[column.key]}px`,
                          minWidth: `${columnWidths[column.key]}px`,
                          maxWidth: `${columnWidths[column.key]}px`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="break-words pr-2 whitespace-normal leading-tight">{column.label}</span>
                          <div
                            className={`resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-col-resize ${resizing === column.key ? 'active' : ''}`}
                            onMouseDown={(e) => handleMouseDown(column.key, e)}
                            title="Drag to resize column"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-sm text-gray-500">
                        No policies found. Policies are automatically collected from government sources.
                      </td>
                    </tr>
                  ) : (
                    policies.map((policy: AIPolicy) => (
                      <tr key={policy.id} className="hover:bg-gray-50">
                        {Object.keys(visibleColumns)
                          .filter(key => visibleColumns[key])
                          .map(columnKey => renderCell(policy, columnKey))
                        }
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
