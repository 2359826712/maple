import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getGoogleButtonLocale,
  googleClientId,
  loadGoogleIdentity,
  type GoogleAccountsId,
} from '@/services/googleIdentity';

type Props = {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onUnavailable: () => void;
};

export default function GoogleSignInButton({ disabled = false, onCredential, onUnavailable }: Props) {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const identityRef = useRef<GoogleAccountsId | null>(null);
  const credentialHandlerRef = useRef(onCredential);
  const unavailableHandlerRef = useRef(onUnavailable);
  const [ready, setReady] = useState(false);
  const locale = getGoogleButtonLocale(i18n.resolvedLanguage || i18n.language);

  credentialHandlerRef.current = onCredential;
  unavailableHandlerRef.current = onUnavailable;

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container || !googleClientId) {
      unavailableHandlerRef.current();
      return undefined;
    }

    void loadGoogleIdentity()
      .then((identity) => {
        if (!active) return;
        identityRef.current = identity;
        identity.initialize({
          client_id: googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response.credential) credentialHandlerRef.current(response.credential);
            else unavailableHandlerRef.current();
          },
        });
        setReady(true);
      })
      .catch(() => {
        if (active) unavailableHandlerRef.current();
      });

    return () => {
      active = false;
      identityRef.current = null;
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const identity = identityRef.current;
    if (!ready || !container || !identity) return undefined;

    container.replaceChildren();
    identity.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(400, Math.max(240, container.clientWidth || 360)),
      locale,
    });

    return () => container.replaceChildren();
  }, [locale, ready]);

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
