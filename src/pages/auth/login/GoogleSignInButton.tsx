import { useEffect, useRef, useState } from 'react';
import { googleClientId, loadGoogleIdentity } from '@/services/googleIdentity';

type Props = {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onUnavailable: () => void;
};

export default function GoogleSignInButton({ disabled = false, onCredential, onUnavailable }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container || !googleClientId) {
      onUnavailable();
      return undefined;
    }

    void loadGoogleIdentity()
      .then((identity) => {
        if (!active) return;
        container.replaceChildren();
        identity.initialize({
          client_id: googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
            else onUnavailable();
          },
        });
        identity.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(400, Math.max(240, container.clientWidth || 360)),
        });
        setReady(true);
      })
      .catch(() => {
        if (active) onUnavailable();
      });

    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [onCredential, onUnavailable]);

  return (
    <div
      className={`min-h-11 w-full overflow-hidden rounded-md ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      aria-busy={!ready}
      aria-disabled={disabled}
    >
      <div ref={containerRef} className="flex min-h-11 w-full justify-center" />
    </div>
  );
}
