import { useState } from 'react';
import { club } from '../../clubs';
import { buildPlan, planPdfBlocks, planText } from '../../content/trip/output';
import { tripTitle, type Trip } from '../../content/trip/trip';
import { copyText, downloadBytes, downloadText, safeFileName } from '../../lib/files';
import { makePdf, pdfBytes } from '../../lib/pdf';
import { exportOne } from '../../lib/savedItems';
import { Button } from '../ui';

/** Print, PDF, copy, text file and a trip file (to back the plan up or move it to another device). */
export function TripExportBar({ trip }: { trip: Trip }) {
  const [message, setMessage] = useState('');
  const title = tripTitle(trip);

  const pdf = () => {
    try {
      const doc = buildPlan(trip);
      const bytes = pdfBytes(makePdf(planPdfBlocks(doc), { title: doc.title, footer: club.appName }));
      downloadBytes(safeFileName(title, 'pdf'), bytes, 'application/pdf');
      setMessage('Downloaded a PDF to this device.');
    } catch {
      setMessage('The PDF could not be made. Use Print and choose “Save as PDF” instead.');
    }
  };

  return (
    <div className="export-bar no-print">
      <div className="export-bar__buttons">
        <Button onClick={pdf}>Download PDF</Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button
          variant="secondary"
          onClick={async () => setMessage((await copyText(planText(buildPlan(trip)))) ? 'Copied the plan as text. You can paste it into a message.' : 'This browser would not copy. Use Download text file instead.')}
        >
          Copy as text
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            downloadText(safeFileName(title, 'txt'), planText(buildPlan(trip)));
            setMessage('Downloaded a text file to this device.');
          }}
        >
          Download text file
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            downloadText(safeFileName(`${title} trip file`, 'json'), exportOne(club.slug, 'trips', { [trip.id]: trip }), 'application/json');
            setMessage('Downloaded a trip file. Import it on My plans to bring this plan back, here or on another device.');
          }}
        >
          Download trip file
        </Button>
      </div>
      <p className="export-bar__message" role="status">
        {message || 'The PDF and the text are made on this device. Nothing is sent anywhere.'}
      </p>
    </div>
  );
}
