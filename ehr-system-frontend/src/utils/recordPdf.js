import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'))
  console.log(`Waiting for ${images.length} images to load...`)

  await Promise.all(
    images.map((image, idx) => {
      if (image.complete) {
        console.log(`Image ${idx} already complete`)
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        const cleanup = () => {
          console.log(`Image ${idx} loaded`)
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
    console.log('Waiting for fonts...')
    await document.fonts.ready
    console.log('Fonts ready')
  }
}

export const generateRecordPdfBlob = async (element) => {
  if (!element) {
    console.error('RecordPdfRenderer: element is null or undefined')
    throw new Error('Template element not found')
  }

  console.log('generateRecordPdfBlob called with element:', element)
  console.log('Element HTML preview:', element.innerHTML.substring(0, 300))
  console.log('Element dimensions:', {
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight
  })

  let captureElement = null

  try {
    captureElement = element.cloneNode(true)
    captureElement.removeAttribute('aria-hidden')
    captureElement.style.position = 'absolute'
    captureElement.style.left = '0'
    captureElement.style.top = '0'
    captureElement.style.width = `${element.scrollWidth || element.offsetWidth || 794}px`
    captureElement.style.minHeight = `${element.scrollHeight || element.offsetHeight || 1122}px`
    captureElement.style.visibility = 'visible'
    captureElement.style.display = 'block'
    captureElement.style.backgroundColor = '#ffffff'
    captureElement.style.pointerEvents = 'none'
    captureElement.style.zIndex = '-1'

    const captureWrapper = document.createElement('div')
    captureWrapper.setAttribute('data-record-pdf-capture', 'true')
    captureWrapper.style.position = 'fixed'
    captureWrapper.style.left = '0'
    captureWrapper.style.top = '0'
    captureWrapper.style.width = captureElement.style.width
    captureWrapper.style.minHeight = captureElement.style.minHeight
    captureWrapper.style.overflow = 'visible'
    captureWrapper.style.backgroundColor = '#ffffff'
    captureWrapper.style.pointerEvents = 'none'
    captureWrapper.style.visibility = 'visible'
    captureWrapper.style.zIndex = '-1'
    captureWrapper.appendChild(captureElement)
    document.body.appendChild(captureWrapper)

    console.log('Waiting for fonts and images...')
    await Promise.all([waitForFonts(), waitForImages(captureElement)])
    await new Promise((resolve) => requestAnimationFrame(resolve))

    console.log('Generating canvas from element...')
    const canvas = await html2canvas(captureElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: true,
      width: captureElement.scrollWidth,
      height: captureElement.scrollHeight,
      windowHeight: captureElement.scrollHeight,
      windowWidth: captureElement.scrollWidth,
      scrollX: 0,
      scrollY: 0,
      allowTaint: true,
      foreignObjectRendering: false
    })

    console.log('Canvas generated, dimensions:', {
      width: canvas.width,
      height: canvas.height
    })
    
    const imageData = canvas.toDataURL('image/png')
    console.log('Image data created:', imageData.substring(0, 50))
    
    // A4 dimensions in mm
    const A4_WIDTH = 210
    const A4_HEIGHT = 297
    
    // Create PDF with A4 format (portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Calculate image dimensions to fit A4 with margins
    const marginTop = 10
    const marginBottom = 10
    const marginLeft = 10
    const marginRight = 10
    
    const availableWidth = A4_WIDTH - marginLeft - marginRight
    const availableHeight = A4_HEIGHT - marginTop - marginBottom
    
    // Get canvas aspect ratio
    const canvasAspectRatio = canvas.width / canvas.height
    
    // Calculate dimensions maintaining aspect ratio
    let imgWidth = availableWidth
    let imgHeight = imgWidth / canvasAspectRatio
    
    // If image is too tall, scale down
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight * canvasAspectRatio
    }

    console.log(`Adding image to PDF: ${imgWidth}mm x ${imgHeight}mm`)
    pdf.addImage(
      imageData,
      'PNG',
      marginLeft,
      marginTop,
      imgWidth,
      imgHeight
    )

    const blob = pdf.output('blob')
    console.log(`PDF created successfully: ${blob.size} bytes`)
    return blob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`PDF generation failed: ${error.message}`)
  } finally {
    const captureWrapper = captureElement?.parentElement
    if (captureWrapper?.dataset.recordPdfCapture === 'true') {
      captureWrapper.remove()
    }
    console.log('Temporary PDF capture element removed')
  }
}

