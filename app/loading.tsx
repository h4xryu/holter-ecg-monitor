import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <h3 className="mt-4 text-xl font-semibold">Loading...</h3>
        <p className="mt-2 text-muted-foreground">Preparing ECG data visualization</p>
      </div>
    </div>
  )
}
