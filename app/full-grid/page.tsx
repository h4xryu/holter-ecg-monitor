import { FullECGGridView } from "@/components/full-ecg-grid-view"

export default function FullGridPage() {
  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Full ECG Grid View</h1>
          <p className="text-muted-foreground">
            View the complete ECG recording with scrolling and zooming capabilities
          </p>
        </div>

        <FullECGGridView />
      </div>
    </main>
  )
}
