export const downloadCsv = (fileName: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) {
    alert('내보낼 데이터가 없습니다.')
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')]
  rows.forEach((row) => {
    const line = headers
      .map((key) => {
        const value = row[key]
        if (value === undefined || value === null) return ''
        const str = String(value).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(',')
    csv.push(line)
  })
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
