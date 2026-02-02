'use client'

import { DecryptForm } from '@/components/DecryptForm'
import { ProgressPanel } from '@/components/ProgressPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useDecryptJob } from '@/hooks/useDecryptJob'

export default function Home() {
  const {
    startJob,
    status,
    progress,
    results,
    error,
    clearError,
    retry,
    cancel,
    reset,
    downloadFile,
    downloadAll,
    downloadCsv,
    isClientFlow
  } = useDecryptJob()

  const showDownloads = isClientFlow || results.some(r => r.downloadUrl)

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-heading">Decrypt Tool</h1>
          <p className="text-muted-foreground">
            Decrypt encrypted Nexar dashcam videos
          </p>
        </header>

        {error && (
          <ErrorAlert
            message={error}
            onDismiss={clearError}
          />
        )}

        {status === 'idle' && (
          <DecryptForm onSubmit={startJob} isProcessing={false} />
        )}

        {status === 'processing' && (
          <ProgressPanel progress={progress} onCancel={cancel} />
        )}

        {(status === 'completed' || status === 'failed') && (
          <div className="space-y-4">
            <ResultsPanel
              results={results}
              onRetry={retry}
              onDownloadAll={downloadAll}
              onDownloadCsv={downloadCsv}
              onDownloadFile={downloadFile}
              showDownloads={showDownloads}
            />
            <div className="text-center">
              <button
                onClick={reset}
                className="text-sm text-primary hover:underline"
              >
                Start New Decryption
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
