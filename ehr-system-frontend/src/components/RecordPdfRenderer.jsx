import React, { useEffect } from 'react'
import RecordTemplate from './RecordTemplate'

export default function RecordPdfRenderer({ record, templateRef }) {
  // Debug log when component renders
  useEffect(() => {
    console.log('RecordPdfRenderer mounted/updated with record:', record)
    return () => {
      console.log('RecordPdfRenderer cleanup')
    }
  }, [record])

  return (
    <div 
      id="pdf-renderer"
      style={{
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: '1000px',
        backgroundColor: 'white',
        padding: '0',
        margin: '0',
        pointerEvents: 'none',
        visibility: 'hidden',
        zIndex: '-1000'
      }}
      aria-hidden="true"
    >
      <div 
        ref={templateRef} 
        style={{
          display: record ? 'block' : 'none',
          width: '100%',
          backgroundColor: 'white'
        }}
      >
        {record ? (
          <RecordTemplate record={record} />
        ) : (
          <div>Loading template...</div>
        )}
      </div>
    </div>
  )
}
