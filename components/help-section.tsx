import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function HelpSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Documentation</CardTitle>
          <CardDescription>Learn how to use the ECG Arrhythmia Classification system</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Getting Started</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    This web application allows you to analyze ECG signals, detect R-peaks, extract segments, and
                    classify arrhythmias using pre-trained models.
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Start by uploading an ECG file (CSV or TXT format) in the Upload tab.</li>
                    <li>Visualize your ECG data and detect R-peaks in the Visualization tab.</li>
                    <li>Upload and select a classification model in the Models tab.</li>
                    <li>Classify the detected segments and view results in the Results tab.</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>File Upload</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>The system supports CSV and TXT files containing ECG signal data.</p>
                  <h4 className="font-medium">Supported Formats:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>CSV:</strong> Time-amplitude pairs with or without headers. Example:{" "}
                      <code>time,amplitude</code> or just <code>0.1,0.5</code>
                    </li>
                    <li>
                      <strong>TXT:</strong> Amplitude values, one per line or space-separated.
                    </li>
                  </ul>
                  <p>
                    Make sure to set the correct sampling rate (Hz) for your data. Common values are 250Hz for many ECG
                    devices, 360Hz for MIT-BIH database, and 257Hz for INCART database.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>R-Peak Detection</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>The system uses an enhanced Pan-Tompkins algorithm to detect R-peaks in the ECG signal.</p>
                  <h4 className="font-medium">Parameters:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Detection Threshold:</strong> Controls the sensitivity of peak detection. Lower values
                      detect more peaks but may include false positives.
                    </li>
                    <li>
                      <strong>Analysis Window:</strong> The time window (in ms) used for analyzing the signal. Adjust
                      based on your ECG characteristics.
                    </li>
                  </ul>
                  <p>
                    After detection, R-peaks are marked with red dots on the ECG visualization. You can adjust
                    parameters and re-detect if needed.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Segment Extraction</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>The system extracts segments around detected R-peaks for classification.</p>
                  <h4 className="font-medium">Database Types:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>MIT-BIH:</strong> Uses 360 samples per segment (standard for MIT-BIH database).
                    </li>
                    <li>
                      <strong>INCART:</strong> Uses 300 samples per segment (standard for INCART database).
                    </li>
                    <li>
                      <strong>Custom:</strong> Allows you to specify a custom segment length.
                    </li>
                  </ul>
                  <p>
                    Each segment is centered around an R-peak and contains the surrounding ECG signal. These segments
                    are used as input for the classification models.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Model Management</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>The system supports ONNX and PyTorch models for arrhythmia classification.</p>
                  <h4 className="font-medium">Supported Model Types:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>ONNX (.onnx):</strong> Open Neural Network Exchange format. Preferred for web-based
                      inference.
                    </li>
                    <li>
                      <strong>PyTorch (.pt, .pth):</strong> PyTorch model format. Will be converted to ONNX for use in
                      the browser.
                    </li>
                  </ul>
                  <h4 className="font-medium">Model Requirements:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Input shape:</strong> (batch, 1, 300/360) depending on database type.
                    </li>
                    <li>
                      <strong>Output shape:</strong> (batch, 5) for NSVFQ classification.
                    </li>
                  </ul>
                  <p>
                    Models are stored in your browser's IndexedDB for persistent access. You can manage (view, select,
                    delete) your models in the Models tab.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Classification</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>The system classifies ECG segments into five arrhythmia categories.</p>
                  <h4 className="font-medium">Arrhythmia Classes:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>N - Normal:</strong> Normal sinus rhythm beats.
                    </li>
                    <li>
                      <strong>S - Supraventricular:</strong> Supraventricular ectopic beats.
                    </li>
                    <li>
                      <strong>V - Ventricular:</strong> Ventricular ectopic beats.
                    </li>
                    <li>
                      <strong>F - Fusion:</strong> Fusion beats.
                    </li>
                    <li>
                      <strong>Q - Unknown:</strong> Unclassifiable beats.
                    </li>
                  </ul>
                  <p>
                    Classification results include the predicted class and confidence score for each segment. You can
                    view results in table format or as a summary with distribution statistics.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Data Privacy</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>This application processes all data entirely in your browser.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>No ECG data is transmitted to any server.</li>
                    <li>Models and data are stored only in your browser's storage.</li>
                    <li>All processing occurs client-side, ensuring data privacy.</li>
                  </ul>
                  <p>This approach ensures that sensitive medical data remains private and secure.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
