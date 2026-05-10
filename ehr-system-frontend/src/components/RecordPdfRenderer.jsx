import RecordTemplate from './RecordTemplate'

export default function RecordPdfRenderer({ record, templateRef }) {
  return (
    <div className="absolute left-[-10000px] top-0" aria-hidden="true">
      <div ref={templateRef} className="inline-block">
        {record && <RecordTemplate record={record} />}
      </div>
    </div>
  )
}
