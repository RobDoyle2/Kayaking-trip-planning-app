import { useState } from 'react';
import { copyText, downloadText, safeFileName } from '../../lib/files';
import { Button } from '../ui';

interface Props {
  /** Used for the file name. */
  title: string;
  /** The plain text to copy or download. */
  text: string;
}

/** Print, copy and download for one page's result. Print is how you save a PDF: choose "Save as PDF" in the print window. */
export function ExportBar({ title, text }: Props) {
  const [message, setMessage] = useState('');
  return (
    <div className="export-bar no-print">
      <div className="export-bar__buttons">
        <Button onClick={() => window.print()}>Print or save as PDF</Button>
        <Button
          variant="secondary"
          onClick={async () => setMessage((await copyText(text)) ? 'Copied the text. You can paste it into a message.' : 'This browser would not copy. Use Download instead.')}
        >
          Copy text
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            downloadText(safeFileName(title, 'txt'), text);
            setMessage('Downloaded a text file to this device.');
          }}
        >
          Download text file
        </Button>
      </div>
      <p className="export-bar__message" role="status">
        {message || 'To save a PDF, choose Print and then pick "Save as PDF" as the printer.'}
      </p>
    </div>
  );
}
