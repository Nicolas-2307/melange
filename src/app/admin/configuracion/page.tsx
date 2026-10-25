import { Suspense } from "react";

import { AdminSkeleton } from "@/components/layout/admin-skeleton";
import { requireAdmin } from "@/features/auth/session";
import { StoreSettingsForm } from "@/features/checkout/components/admin/store-settings-form";
import { ZoneForm } from "@/features/checkout/components/admin/zone-form";
import { getAllDeliveryZones, getStoreSettings } from "@/features/checkout/store";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminSettingsPageContent />
    </Suspense>
  );
}

// Session + database reads stay inside Suspense so panel navigation can be instant.
async function AdminSettingsPageContent() {
  await requireAdmin();
  const [settings, zones] = await Promise.all([getStoreSettings(), getAllDeliveryZones()]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Los cambios se aplican de inmediato en el checkout de la tienda.
        </p>
      </div>

      <section aria-labelledby="availability" className="flex flex-col gap-4">
        <h2 id="availability" className="text-lg font-semibold">
          Disponibilidad y sede
        </h2>
        <StoreSettingsForm settings={settings} />
      </section>

      <section aria-labelledby="zones" className="flex flex-col gap-4">
        <div>
          <h2 id="zones" className="text-lg font-semibold">
            Zonas de domicilio
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            El cliente elige su zona y se suma el valor del domicilio. Las zonas inactivas no se
            muestran.
          </p>
        </div>
        <ZoneForm />
        {zones.map((zone) => (
          <ZoneForm key={zone.id} zone={zone} />
        ))}
      </section>
    </>
  );
}
