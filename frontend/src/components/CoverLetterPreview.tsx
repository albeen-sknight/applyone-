type CoverLetterPreviewProps = {
  letter: string;
  onClose?: () => void;
};

export default function CoverLetterPreview({ letter, onClose }: CoverLetterPreviewProps) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Carta de presentación</h3>
        {onClose ? (
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-black/10 px-3 text-sm font-medium">
            Cerrar
          </button>
        ) : null}
      </div>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-olive">{letter || "Selecciona una candidatura para ver la carta."}</pre>
    </section>
  );
}
