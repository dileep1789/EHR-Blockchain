import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'))

  await Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        const cleanup = () => {
          image.removeEventListener('load', cleanup)
          image.removeEventListener('error', cleanup)
          resolve()
        }

        image.addEventListener('load', cleanup)
        image.addEventListener('error', cleanup)
      })
    })
  )
}

const waitForFonts = async () => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }
}

export const generateRecordPdfBlob = async (element) => {
  if (!element) {
    return null
  }

  await Promise.all([waitForFonts(), waitForImages(element)])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  const imageData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  })

  pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
  return pdf.output('blob')
}

