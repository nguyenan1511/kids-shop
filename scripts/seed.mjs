#!/usr/bin/env node
// Seed categories, products, photos and videos from /products into Supabase.
// Usage: node scripts/seed.mjs [--force]
//   --force  wipe existing catalog (categories/products/images/videos) first.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { categories, products, videoCount } from "../supabase/seed/catalog.mjs";
import { loadEnv } from "./env.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
loadEnv(root);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");

const force = process.argv.includes("--force");
const db = createClient(url, key, { auth: { persistSession: false } });
const srcDir = path.join(root, "products");
const cacheDir = path.join(root, ".cache", "media");
fs.mkdirSync(cacheDir, { recursive: true });

const photos = fs.readdirSync(srcDir).filter((f) => f.endsWith(".jpg")).sort();
const videos = fs.readdirSync(srcDir).filter((f) => f.endsWith(".mp4")).sort();
if (videos.length !== videoCount) console.warn(`! expected ${videoCount} videos, found ${videos.length}`);

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}

/** Resize a photo to max 1200px WebP (sharp). Returns local cached path. */
async function processPhoto(n) {
  const file = photos[n - 1];
  if (!file) throw new Error(`Photo #${n} not found`);
  const out = path.join(cacheDir, `photo-${String(n).padStart(2, "0")}.webp`);
  if (!fs.existsSync(out)) {
    await sharp(path.join(srcDir, file))
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);
  }
  return out;
}

/** Compress a video to 720p H.264 + poster frame. */
async function processVideo(n) {
  const file = videos[n - 1];
  const out = path.join(cacheDir, `video-${n}.mp4`);
  const poster = path.join(cacheDir, `video-${n}-poster.webp`);
  if (!fs.existsSync(out)) {
    ffmpeg(["-i", path.join(srcDir, file), "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-crf", "28",
      "-preset", "medium", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out]);
  }
  if (!fs.existsSync(poster)) {
    const frame = path.join(cacheDir, `video-${n}-frame.png`);
    ffmpeg(["-ss", "1", "-i", out, "-frames:v", "1", frame]);
    await sharp(frame).resize(540).webp({ quality: 75 }).toFile(poster);
    fs.rmSync(frame);
  }
  return { out, poster };
}

async function upload(localPath, storagePath, contentType) {
  const { error } = await db.storage.from("media").upload(storagePath, fs.readFileSync(localPath), {
    contentType, upsert: true, cacheControl: "31536000",
  });
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
  return storagePath;
}

async function must(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function main() {
  const { count } = await db.from("products").select("*", { count: "exact", head: true });
  if (count && !force) {
    console.log(`Catalog already has ${count} products. Use --force to wipe and reseed.`);
    return;
  }
  if (force) {
    console.log("Wiping catalog…");
    await must(db.from("videos").delete().not("id", "is", null), "wipe videos");
    await must(db.from("product_images").delete().not("id", "is", null), "wipe images");
    await must(db.from("products").delete().not("id", "is", null), "wipe products");
    await must(db.from("categories").delete().not("id", "is", null), "wipe categories");
  }

  console.log("Categories…");
  const catIds = {};
  for (const [i, c] of categories.entries()) {
    const img = await upload(await processPhoto(c.cover), `categories/${c.slug}.webp`, "image/webp");
    const row = await must(
      db.from("categories").insert({ name: c.name, slug: c.slug, image_path: img, sort_order: i }).select("id").single(),
      `category ${c.slug}`,
    );
    catIds[c.slug] = row.id;
  }

  console.log("Products…");
  for (const [i, p] of products.entries()) {
    const row = await must(
      db.from("products").insert({
        slug: p.slug, name: p.name, description: p.description, price: p.price, old_price: p.oldPrice ?? null,
        age_range: p.age, category_id: catIds[p.category], options: p.options,
        is_visible: p.price > 0, is_featured: Boolean(p.featured), sort_order: i,
      }).select("id").single(),
      `product ${p.slug}`,
    );
    for (const [j, n] of p.photos.entries()) {
      const storagePath = await upload(await processPhoto(n), `products/${p.slug}/${j + 1}.webp`, "image/webp");
      await must(db.from("product_images").insert({ product_id: row.id, path: storagePath, sort_order: j }), "image");
    }
    process.stdout.write(".");
  }
  console.log();

  console.log("Videos…");
  for (let n = 1; n <= videos.length; n++) {
    const { out, poster } = await processVideo(n);
    const vPath = await upload(out, `videos/video-${n}.mp4`, "video/mp4");
    const pPath = await upload(poster, `videos/video-${n}-poster.webp`, "image/webp");
    await must(db.from("videos").insert({ path: vPath, poster_path: pPath, sort_order: n }), "video");
    process.stdout.write(".");
  }
  console.log();

  const visible = products.filter((p) => p.price > 0).length;
  console.log(`Done: ${categories.length} categories, ${products.length} products (${visible} visible), ${videos.length} videos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
