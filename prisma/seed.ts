import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Import actual data from BookData.ts
import {
  writers as jsonWriters,
  publishers as jsonPublishers,
  categories as jsonCategories,
  products as jsonProducts,
} from "../public/BookData";

const db = new PrismaClient();

// Simple slugify helper
function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  /**
   * ------------------------------------------------------------------
   * 1️⃣ Admin User
   * ------------------------------------------------------------------
   */
  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";

  const adminExists = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExists) {
    await db.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: "admin",
      },
    });

    console.log("✅ Admin created:", adminEmail);
  } else {
    console.log("ℹ️ Admin already exists");
  }

  /**
   * ------------------------------------------------------------------
   * 2️⃣ Normal User
   * ------------------------------------------------------------------
   */
  const userEmail = "user@example.com";

  const userExists = await db.user.findUnique({
    where: { email: userEmail },
  });

  if (!userExists) {
    await db.user.create({
      data: {
        name: "Test User",
        email: userEmail,
        passwordHash: await bcrypt.hash("user123", 10),
        role: "user",
      },
    });

    console.log("✅ User created:", userEmail);
  } else {
    console.log("ℹ️ User already exists");
  }

  /**
   * ------------------------------------------------------------------
   * 3️⃣ Writers
   * ------------------------------------------------------------------
   */
  const writerNameToId = new Map<string, number>();

  for (const w of jsonWriters) {
    const writer = await db.writer.upsert({
      where: { name: w.name },
      update: {
        image: w.image ?? null,
      },
      create: {
        name: w.name,
        image: w.image ?? null,
      },
    });

    writerNameToId.set(w.name, writer.id);
  }

  console.log("✅ Writers seeded");

  /**
   * ------------------------------------------------------------------
   * 4️⃣ Publishers
   * ------------------------------------------------------------------
   */
  const publisherNameToId = new Map<string, number>();

  for (const p of jsonPublishers) {
    const publisher = await db.publisher.upsert({
      where: { name: p.name },
      update: {
        image: p.image ?? null,
      },
      create: {
        name: p.name,
        image: p.image ?? null,
      },
    });

    publisherNameToId.set(p.name, publisher.id);
  }

  console.log("✅ Publishers seeded");

  /**
   * ------------------------------------------------------------------
   * 5️⃣ Categories
   * ------------------------------------------------------------------
   */
  const categoryNameToId = new Map<string, number>();

  for (const c of jsonCategories) {
    const category = await db.category.upsert({
      where: { name: c.name },
      update: {
        name: c.name,
      },
      create: {
        name: c.name,
      },
    });

    categoryNameToId.set(c.name, category.id);
  }

  console.log("✅ Categories seeded");

  /**
   * ------------------------------------------------------------------
   * 6️⃣ Products
   * ------------------------------------------------------------------
   */
  for (const p of jsonProducts) {
    const writerId = p.writer ? writerNameToId.get(p.writer.name) : undefined;

    const publisherId = p.publisher
      ? publisherNameToId.get(p.publisher.name)
      : undefined;

    const categoryId = categoryNameToId.get(p.category.name);

    if (!categoryId) {
      console.warn(`⚠️ Category missing for product: ${p.name}`);
      continue;
    }

    const slug = slugify(`${p.name}-${p.id}`);

    await db.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        writerId,
        publisherId,
        categoryId,
        description: p.description ?? "",
        price: p.price,
        original_price: p.original_price ?? null,
        discount: p.discount ?? 0,
        stock: p.stock ?? 0,
        available: true,
        image: p.image ?? null,
      },
      create: {
        name: p.name,
        slug,
        writerId,
        publisherId,
        categoryId,
        description: p.description ?? "",
        price: p.price,
        original_price: p.original_price ?? null,
        discount: p.discount ?? 0,
        stock: p.stock ?? 0,
        available: true,
        image: p.image ?? null,
        gallery: [],
      },
    });

    console.log("📚 Product seeded:", p.name);
  }

  console.log("✅ All products seeded");

  /**
   * ------------------------------------------------------------------
   * 7️⃣ Create 1 Blog
   * ------------------------------------------------------------------
   */
  const blogExists = await db.blog.findFirst({
    where: { slug: "sabr-more-than-patience" },
  });

  if (!blogExists) {
    await db.blog.create({
      data: {
        slug: "sabr-more-than-patience",
        title: "Sabr – More Than Patience",
        summary:
          "For many Muslims, the term sabr has become synonymous with the word “patience.” However, the beauty of the Arabic language is that many Arabic words, such as sabr, ihsan, taqwa, and more, have such a vast scope that there is no single word in the English language that equates to them. Focusing on the concept of sabr, the term has a much broader meaning than patience.",
        content:
          "As Muslims we understand the importance of displaying the attribute of sabr in our lives. Along with being a part of one of Allah’s 99 names (Aṣ-Sabūr), Allah has commanded the believers to embody this characteristic. This is shown in the following verse from the Qur’an: “O you who believe! Seek help with patient perseverance (sabr) and prayer, for God is with those who patiently persevere.” (2:153)In the English language, the word “patience” is seen as a reactive word with a negative connotation, meaning that you are patient after a trial or test strikes. Some people go as far as to say that patience means sitting back and praying while hoping for a miracle to fix the situation. However, this is simply not true Islamic patience. True sabr (just like tawwakul) is an active and positive attribute. The linguistic definition of sabr is to restrain or stop, and the literal definition of the word (depending on how it’s used) is perseverance or steadfastness. In that sense, one possible definition that scholars have given is that sabr is the perseverance to stay steadfast regardless of circumstances. Looking deeper than the surface level definition of sabr, many scholars have actually mentioned that sabr has 3 different categories or forms: 1. Patience in obeying Allah (SWT) (sabr ‘ala al-ta’a ) This form of sabr means following what Allah has commanded, even when it is not convenient or easy. For example, in verse 134 of Surah Al-Imran, Allah commands us to restrain our anger. Anger is a natural human emotion, and we will all experience times when we will be tempted to lose control of our emotions. However, though none of us will be perfect, the efforts that we put toward restraining our anger when we are tempted to flare up is an act of sabr. 2. Patience in abstaining from the forbidden (sabr ‘an al-ma’siyyah ) There is an abundance of things in our modern society which are accepted by the masses but go against what Allah has commanded us or Prophet Muhammad (PBUH) advised us. For example, the use of foul language is widely accepted in today’s culture, but there are many authentic hadiths in which Prophet Muhammad (PBUH) warns us of how grave a sin the use of foul language is. Even Allah forbids us from using foul language in the eleventh verse of Surah Hujurat. sabr in this category means prioritizing Allah’s commandments and Prophet Muhammad’s (PBUH) advice over what society or the world tells us is alright. In other words, sabr here means that we follow Allah’s decrees over society’s laws or accepted practices, and we put forth the effort to stay steadfast in these efforts. 3. Patience in the face of adversity (sabr ‘ala al-ibtila ). Every one of us will go through times when we are faced with adversity. Adversity may come in different forms. It may be a financial, health, family, or personal challenge. sabr in this category means not losing our faith when we are faced with adversity and staying consistent in our efforts to overcome the obstacle. The best example of this kind of sabr is the example of Prophet Muhammad (PBUH) when he was preaching Islam in Mecca for the first thirteen years of his mission. For thirteen years, he faced every kind of hardship, abuse, and trial. However, through it all, he stayed consistent in his efforts, consistent in his prayers, and consistent in his hopes and positive attitude toward Allah. Obviously, none of us have the same level of faith as Prophet Muhammad (PBUH) because he was the best of humanity. However, his example of sabr should serve as a teaching point to us on how sabr can be applied into our daily lives. Through his example, we see that there are 3 characteristics that we should aim to display when facing adversity. Those characteristics are: 1. Not complaining: Prophet Muhammad (PBUH) said, “The real patience is at the first stroke of a calamity.” (Bukhari). What this means is that our initial reaction when faced with an obstacle shows our true faith in Allah. When we experience or hear of a problem, is the first word to come out of our mouth a curse word or complaint, or is the first thing we say “Alhumdulillah?” The answer to this question demonstrates our faith in Allah. After all, complaining opens the door to Shaytan. 2. Not relenting in efforts: sabr and is shown in our efforts. In the Qur’an, Allah states: “Indeed, Allah will not change the condition of a people until they change what is in themselves” (13:11). This shows that, though the results are always in Allah’s hands, we need to put forth some effort when faced with an adversity or obstacle. When Prophet Muhammad (PBUH) was preaching in Mecca, he never relented in his efforts. He did not simply pray to Allah and wait for a miracle. Instead, he was active in his efforts to propagate Islam. He did everythin g in his power to share the message of Islam with people, regardless of whether or not his efforts were producing any fruit. 3. Not relenting in prayer: True faith is shown in tough times. Therefore, when we are faced with adversity, we need to dig deeper into our relationship with Allah because He is the one who can truly change our situation. No matter what Prophet Muhamad (PBUH) went through while in Mecca during those thirteen years, he never relented in his prayer to Allah, and his external situation never affected his attitude toward Allah. Even when he lost his beloved wife Khadijah (RA) and beloved uncle Abu Talib during the Year of Sorrow, he still continued to turn back to Allah. We cannot always choose our situation, but we can choose our attitude and how we react to a situation. Reward for SABR There are dozens of rewards mentioned for those who display sabr in their lives. For the sake of keeping things brief, let’s mention one reward the Qur’an tells us: “Allah loves those who have sabr.” (Qur’an, 3:146)Unlike many other rewards Allah promises, Allah’s love is not quantified by a number. However, in one famous Hadith Al-Qudsi, Prophet Muhammad (PBUH) explained the blessings we receive when Allah loves us: Prophet Muhammad (PBUH) said: Allah (SWT) said: “When I love [my servant] I am his hearing with which he hears, his seeing with which he sees, his hand with which he strikes and his foot with which he walks. Were he to ask [something] of Me, I would surely give it to him, and were he to ask Me for refuge, I would surely grant him it.” (Bukhari).And what can be a better reward than this?",
        date: new Date(),
        author: "Admin",
        image: "/upload/blogImages/1764487150824-Sabr-in-Islam.jpg",
      },
    });

    console.log("📝 Blog created");
  } else {
    console.log("ℹ️ Blog already exists");
  }

  /**
   * ------------------------------------------------------------------
   * 8️⃣ Create Sample Newsletter Subscribers
   * ------------------------------------------------------------------
   */
  const subscribers = [
    { email: "subscriber1@example.com" },
    { email: "subscriber2@example.com" },
    { email: "estiakahmed898@gmail.com" },
  ];

  for (const subscriber of subscribers) {
    await db.newsletterSubscriber.upsert({
      where: { email: subscriber.email },
      update: {
        status: "subscribed",
      },
      create: {
        email: subscriber.email,
        status: "subscribed",
      },
    });
  }

  console.log("✅ Newsletter subscribers seeded");

  /**
   * ------------------------------------------------------------------
   * 9️⃣ Create Sample Coupon
   * ------------------------------------------------------------------
   */
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      discountType: "percentage",
      discountValue: 10.0,
      minOrderValue: 500.0,
      maxDiscount: 100.0,
      usageLimit: 100,
      isValid: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      code: "WELCOME10",
      discountType: "percentage",
      discountValue: 10.0,
      minOrderValue: 500.0,
      maxDiscount: 100.0,
      usageLimit: 100,
      isValid: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Coupon seeded");
}

main()
  .then(() => {
    console.log("🎉 Seeding completed successfully!");
  })
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });