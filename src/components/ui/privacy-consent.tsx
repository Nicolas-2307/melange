import Link from "next/link";

/**
 * Express authorization checkbox required by Ley 1581 de 2012 wherever personal data is
 * collected (sign-up, checkout). Submits as name="privacyAccepted" value="on".
 */
export function PrivacyConsent({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="privacyAccepted"
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-4"
        />
        <span>
          Autorizo el tratamiento de mis datos personales según la{" "}
          <Link href="/legal/privacidad" target="_blank" className="underline">
            política de tratamiento de datos
          </Link>{" "}
          y acepto los{" "}
          <Link href="/legal/terminos" target="_blank" className="underline">
            términos y condiciones
          </Link>
          .
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
