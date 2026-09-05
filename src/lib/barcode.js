import JsBarcode from 'jsbarcode'

export function generateBarcodeDataUrl(value, options = {}) {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 16,
    margin: 6,
    ...options
  })
  return canvas.toDataURL('image/png')
}
