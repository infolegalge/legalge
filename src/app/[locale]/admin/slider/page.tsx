import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import type { Locale } from "@/i18n/locales";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function createSlide(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const lightUrl = String(formData.get("lightUrl") || "").trim();
  const darkUrl = String(formData.get("darkUrl") || "").trim();
  const orderIndex = Number(formData.get("orderIndex") || 0);
  if (!lightUrl || !darkUrl) return;
  await prisma.sliderSlide.create({ data: { lightUrl, darkUrl, orderIndex } });
  revalidatePath("/");
}

async function deleteSlide(id: string) {
  "use server";
  await requireSuperAdmin();
  await prisma.sliderSlide.delete({ where: { id } });
  revalidatePath("/");
}

async function deleteSlideAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) {
    await deleteSlide(id);
  }
}

export default async function SliderAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const slides = await prisma.sliderSlide.findMany({ orderBy: { orderIndex: "asc" } });
  return (
    <div>
      <h2 className="text-xl font-semibold">Slider</h2>
      <form action={createSlide} className="mt-4 grid gap-3 rounded border p-4">
        <div>
          <label className="mb-1 block text-sm">Light image URL</label>
          <input name="lightUrl" className="w-full rounded border px-3 py-2" placeholder="/uploads/01light.webp" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Dark image URL</label>
          <input name="darkUrl" className="w-full rounded border px-3 py-2" placeholder="/uploads/01dark.webp" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Order</label>
          <input name="orderIndex" type="number" defaultValue={slides.length} className="w-full rounded border px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Add slide</button>
      </form>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((s) => (
          <li key={s.id} className="overflow-hidden rounded border">
            <div className="relative h-40 w-full">
              <img src={s.lightUrl} alt="" className="absolute inset-0 h-full w-full object-cover dark:opacity-0" loading="lazy" decoding="async" />
              <img src={s.darkUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 dark:opacity-100" loading="lazy" decoding="async" />
            </div>
            <div className="flex items-center justify-between p-2 text-sm">
              <span className="truncate">#{s.orderIndex}</span>
              <form action={deleteSlideAction}>
                <input type="hidden" name="id" value={s.id} />
                <button className="rounded border px-2 py-1 hover:bg-muted">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


