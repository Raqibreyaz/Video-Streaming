// Global type declarations for Media Chrome and HLS video Web Components

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      "hls-video": React.DetailedHTMLProps<
        React.VideoHTMLAttributes<HTMLVideoElement> & {
          src?: string;
          slot?: string;
          crossOrigin?: string;
          preload?: string;
        },
        HTMLVideoElement
      >;
      "media-controller": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-control-bar": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-play-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-mute-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-volume-range": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-time-range": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-time-display": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { showduration?: string },
        HTMLElement
      >;
      "media-duration-display": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-playback-rate-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-fullscreen-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-pip-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-captions-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "media-loading-indicator": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { noautohide?: string; slot?: string },
        HTMLElement
      >;
    }
  }
}
