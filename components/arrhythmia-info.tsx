export function ArrhythmiaInfo() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Arrhythmia Classes</h3>

      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <h4 className="font-medium">N - Normal</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Normal sinus rhythm beats. These represent the standard heartbeat pattern originating from the sinoatrial
            node, the heart's natural pacemaker.
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h4 className="font-medium">S - Supraventricular</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Supraventricular ectopic beats. These originate from the atria or AV node, above the ventricles. They
            include premature atrial contractions (PACs) and are often benign but can indicate atrial issues.
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h4 className="font-medium">V - Ventricular</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Ventricular ectopic beats. These originate from the ventricles rather than the sinoatrial node. They include
            premature ventricular contractions (PVCs) and can be indicators of heart disease in some contexts.
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h4 className="font-medium">F - Fusion</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Fusion beats. These occur when a normal sinus impulse and an ectopic beat (typically ventricular) activate
            the ventricles simultaneously, resulting in a fusion of both morphologies.
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h4 className="font-medium">Q - Unknown</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Unclassifiable beats. These are beats that cannot be reliably assigned to other categories due to noise,
            unusual morphology, or other factors that make classification difficult.
          </p>
        </div>
      </div>
    </div>
  )
}
