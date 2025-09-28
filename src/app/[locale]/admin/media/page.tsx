import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Image from "next/image";
//

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<import("next-auth").Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function uploadMedia(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const file = formData.get("file");
  const alt = String(formData.get("alt") || "");
  const locale = String(formData.get("locale") || "");
  if (!(file instanceof File)) return;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
  const filepath = path.join(uploadsDir, filename);
  await fs.writeFile(filepath, buffer);
  const url = `/uploads/${filename}`;
  await prisma.media.create({ data: { url, alt } });
  revalidatePath("/");
  if (locale) revalidatePath(`/${locale}/admin/media`);
}

async function deleteMediaAction(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const id = String(formData.get("id") || "");
  const locale = String(formData.get("locale") || "");
  const m = await prisma.media.findUnique({ where: { id } });
  if (m) {
    const disk = path.join(process.cwd(), "public", m.url.replace(/^\//, ""));
    try { await fs.unlink(disk); } catch {}
    await prisma.media.delete({ where: { id } });
  }
  revalidatePath("/");
  if (locale) revalidatePath(`/${locale}/admin/media`);
}

export default async function MediaAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h2 className="text-xl font-semibold">Media</h2>
      <form action={uploadMedia} className="mt-4 grid gap-3 rounded border p-4">
        <div>
          <label className="mb-1 block text-sm">File</label>
          <input name="file" type="file" accept="image/*" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Alt</label>
          <input name="alt" className="w-full rounded border px-3 py-2" />
        </div>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Upload</button>
      </form>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <li key={m.id} className="overflow-hidden rounded border">
            <div className="relative h-40 w-full">
              <Image src={m.url} alt={m.alt} fill className="object-cover" />
            </div>
            <div className="flex items-center justify-between p-2 text-sm">
              <span className="truncate">{m.url}</span>
              <form action={deleteMediaAction}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="locale" value={locale} />
                <button className="rounded border px-2 py-1 hover:bg-muted">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
