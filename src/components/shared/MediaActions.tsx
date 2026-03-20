import { FaDownload, FaShareAlt } from "react-icons/fa";

type Props = {
  containerClassName: string;
  buttonClassName: string;
  downloadHref?: string | null;
  downloadFileName?: string;
  showShare?: boolean;
  shareAriaLabel?: string;
  shareTitle?: string;
  onShare: () => void;
};

export function MediaActions({
  containerClassName,
  buttonClassName,
  downloadHref,
  downloadFileName,
  showShare = true,
  shareAriaLabel,
  shareTitle,
  onShare,
}: Props) {
  return (
    <div className={containerClassName} aria-label="Acciones">
      {!!downloadHref && (
        <a
          className={buttonClassName}
          href={downloadHref}
          download={downloadFileName}
          target="_blank"
          rel="noopener noreferrer"
          title="Descargar imagen"
          aria-label="Descargar imagen"
        >
          <FaDownload />
        </a>
      )}
      {showShare && (
        <button
          type="button"
          className={buttonClassName}
          title={shareTitle}
          aria-label={shareAriaLabel}
          onClick={onShare}
        >
          <FaShareAlt />
        </button>
      )}
    </div>
  );
}

