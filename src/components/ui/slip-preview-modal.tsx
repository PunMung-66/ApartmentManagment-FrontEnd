import { useEffect } from "react"
import { X, Download } from "lucide-react"

interface SlipPreviewModalProps {
  slipUrl: string
  onClose: () => void
}

export default function SlipPreviewModal({ slipUrl, onClose }: SlipPreviewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Payment Slip</p>
          <div className="flex items-center gap-1">
            <a
              href={slipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto p-4">
          <img
            src={slipUrl}
            alt="Payment slip"
            className="mx-auto h-auto max-w-full rounded-lg object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none"
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                const fallback = document.createElement("div")
                fallback.className =
                  "flex flex-col items-center justify-center py-12 text-gray-400"
                fallback.innerHTML = `
                  <svg class="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-sm">Failed to load image</p>
                `
                parent.appendChild(fallback)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}