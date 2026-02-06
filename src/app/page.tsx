'use client'

import { DecryptForm } from '@/components/DecryptForm'
import { ProgressPanel } from '@/components/ProgressPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FolderErrorDialog, isFolderCreationError } from '@/components/FolderErrorDialog'
import { useDecryptJob } from '@/hooks/useDecryptJob'
import packageJson from '../../package.json'

export default function Home() {
  const {
    startJob,
    restartWithPrefix,
    retryWithManualFolder,
    status,
    progress,
    results,
    error,
    clearError,
    retry,
    cancel,
    pause,
    resume,
    isPaused,
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
          <p className="text-xs text-muted-foreground">v{packageJson.version}</p>
        </header>

        {error && isFolderCreationError(error) ? (
          <FolderErrorDialog
            error={error}
            onUsePrefix={restartWithPrefix}
            onRetryWithFolder={retryWithManualFolder}
            onCancel={reset}
          />
        ) : error && (
          <ErrorAlert
            message={error}
            onDismiss={clearError}
          />
        )}

        {status === 'idle' && (
          <DecryptForm onSubmit={startJob} isProcessing={false} />
        )}

        {(status === 'processing' || isPaused) && (
          <ProgressPanel
            progress={progress}
            results={results}
            onCancel={cancel}
            onPause={pause}
            onResume={resume}
            isPaused={isPaused}
          />
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

        <footer className="pt-8 border-t border-border text-center text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Note:</strong> Only Google Drive → Google Drive flow has been tested.
            Other source/destination combinations may have issues.
          </p>
          <p>
            Found a bug? Contributions welcome at{' '}
            <a
              href="https://github.com/getnexar/decrypt-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              github.com/getnexar/decrypt-tool
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
