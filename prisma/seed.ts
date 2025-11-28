import { PrismaClient, OrderStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ⬇️ এখানে path ঠিক থাকলে কিছু পরিবর্তন লাগবে না
import {
  writers as jsonWriters,
  publishers as jsonPublishers,
  categories as jsonCategories,
  products as jsonProducts,
} from "../public/BookData";

const db = new PrismaClient();

// simple slugify helper
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
      update: { image: w.image },
      create: { name: w.name, image: w.image },
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
      update: { image: p.image },
      create: { name: p.name, image: p.image },
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
      update: {},
      create: { name: c.name },
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
        price: p.price,
        image: p.image,
        stock: p.stock ?? 0,
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
    where: { slug: "welcome-blog" },
  });

  if (!blogExists) {
    await db.blog.create({
      data: {
        slug: "welcome-blog",
        title: "Welcome to Hilful Fuzul Book Shop",
        summary: "This is the first blog of HF Publication.",
        content: "Blog content here...",
        date: new Date(),
        author: "Admin",
        image: "/blog/demo.jpg",
      },
    });

    console.log("📝 Blog created");
  } else {
    console.log("ℹ️ Blog already exists");
  }
}

main()
  .then(() => console.log("🎉 Seeding completed successfully!"))
  .catch((e) => console.error("❌ Seed error:", e))
  .finally(async () => {
    await db.$disconnect();
  });


// // prisma/seed.ts
// import { PrismaClient, OrderStatus, PaymentStatus } from "@prisma/client";
// import bcrypt from "bcryptjs";
// import { generateSlug } from "../lib/utils";

// // ⬇️ এখানে path টা তোমার প্রজেক্ট স্ট্রাকচার অনুযায়ী ঠিক করবে
// import {
//   writers as jsonWriters,
//   publishers as jsonPublishers,
//   categories as jsonCategories,
//   products as jsonProducts,
//   orders as jsonOrders,
//   blogs as jsonBlogs,
//   // contacts as jsonContacts, // Contact model নাই, তাই এখন ব্যবহার করছি না
// } from "../public/BookData"; // <--- এই লাইনের path adjust করো

// const db = new PrismaClient();

// // simple slugify helper
// function slugify(str: string) {
//   return str
//     .toLowerCase()
//     .replace(/[\s\W-]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// }

// async function main() {
//   /**
//    * 1️⃣ Admin user seed (তোমার পুরোনো কোড)
//    */
//   const adminEmail = "admin@example.com";
//   const adminPassword = "admin123";

//   const existingAdmin = await db.user.findUnique({
//     where: { email: adminEmail },
//   });

//   if (!existingAdmin) {
//     const passwordHash = await bcrypt.hash(adminPassword, 10);

//     await db.user.create({
//       data: {
//         name: "Super Admin",
//         email: adminEmail,
//         passwordHash,
//         role: "admin",
//       },
//     });

//     console.log("✅ Admin created:");
//     console.log("  Email:", adminEmail);
//     console.log("  Password:", adminPassword);
//   } else {
//     console.log("ℹ️ Admin already exists:", existingAdmin.email);
//   }

//   /**
//    * 2️⃣ Writers, Publishers, Categories
//    * BookData.ts থেকে আলাদা করে এগুলোও seed করব,
//    * এবং নাম দিয়ে map করে নিব, যাতে Products এ সহজে ব্যবহার করা যায়।
//    */

//   const writerNameToId = new Map<string, number>();
//   const publisherNameToId = new Map<string, number>();
//   const categoryNameToId = new Map<string, number>();

//   // Writers
//   for (const w of jsonWriters) {
//     const writer = await db.writer.upsert({
//       where: { name: w.name },
//       update: {
//         image: w.image,
//       },
//       create: {
//         name: w.name,
//         image: w.image,
//       },
//     });

//     writerNameToId.set(w.name, writer.id);
//   }

//   // Publishers
//   for (const p of jsonPublishers) {
//     const publisher = await db.publisher.upsert({
//       where: { name: p.name },
//       update: {
//         image: p.image,
//       },
//       create: {
//         name: p.name,
//         image: p.image,
//       },
//     });

//     publisherNameToId.set(p.name, publisher.id);
//   }

//   // Categories
//   for (const c of jsonCategories) {
//     const category = await db.category.upsert({
//       where: { name: c.name },
//       update: {},
//       create: {
//         name: c.name,
//       },
//     });

//     categoryNameToId.set(c.name, category.id);
//   }

//   console.log("✅ Writers, publishers, categories seeded");

//   /**
//    * 3️⃣ Products
//    * এখানে JSON product এর সাথে DB product এর mapping রাখব,
//    * যাতে orders-এর ভেতরে product থেকে সহজে productId পাওয়া যায়।
//    */

//   const productJsonIdToDbId = new Map<number, number>();

//   for (const p of jsonProducts) {
//     const writerName = p.writer?.name as string | undefined;
//     const publisherName = p.publisher?.name as string | undefined;
//     const categoryName = p.category?.name as string | undefined;

//     const writerId = writerName ? writerNameToId.get(writerName) : undefined;
//     const publisherId = publisherName
//       ? publisherNameToId.get(publisherName)
//       : undefined;
//     const categoryId = categoryName
//       ? categoryNameToId.get(categoryName)
//       : undefined;

//     if (!categoryId) {
//       console.warn(
//         `⚠️ Category not found for product "${p.name}", skipping this product`
//       );
//       continue;
//     }

//     const baseSlug = slugify(p.name);
//     const slug = `${baseSlug}-${p.id}`; // unique slug

//     const existingProduct = await db.product.findUnique({
//       where: { slug },
//     });

//     if (existingProduct) {
//       console.log(`ℹ️ Product already exists, skipping: ${p.name}`);
//       productJsonIdToDbId.set(p.id as number, existingProduct.id);
//       continue;
//     }

//     const created = await db.product.create({
//       data: {
//         name: p.name,
//         slug,
//         writerId,
//         publisherId,
//         categoryId,
//         description: p.description ?? "",
//         price: p.price,
//         original_price: p.original_price,
//         discount: p.discount ?? 0,
//         stock: p.stock ?? 0,
//         available: p.available ?? true,
//         image: p.image ?? null,
//         gallery: [], // JSON e nai, empty array
//         pdf: p.pdf ?? null,
//         // soldCount, ratingAvg, ratingCount default thakbe schema theke
//       },
//     });

//     productJsonIdToDbId.set(p.id as number, created.id);

//     console.log(`✅ Product created: ${p.name}`);
//   }

//   console.log("🎉 All products seeded from JSON");

//   /**
//    * 4️⃣ Orders + OrderItems
//    * BookData.ts এর orders array থেকে seed করব।
//    * orders[i].products -> প্রতিটা জন্য orderItems create করব।
//    */

//   for (const o of jsonOrders) {
//     // check if same name+email+total er order already ache kina
//     const existingOrder = await db.order.findFirst({
//       where: {
//         name: o.name,
//         email: o.email,
//         total: o.total,
//       },
//     });

//     if (existingOrder) {
//       console.log(`ℹ️ Order already exists, skipping: ${o.name}`);
//       continue;
//     }

//     const order = await db.order.create({
//       data: {
//         userId: null, // চাইলে future এ user-re link korte paro
//         name: o.name,
//         email: o.email,
//         phone_number: o.phone_number,
//         alt_phone_number: o.alt_phone_number ?? null,
//         country: o.country,
//         district: o.district,
//         area: o.area,
//         address_details: o.address_details,
//         payment_method: o.payment_method,
//         total: o.total,
//         shipping_cost: o.shipping_cost,
//         grand_total: o.grand_total,
//         status: OrderStatus.PENDING,
//         paymentStatus: PaymentStatus.UNPAID,
//       },
//     });

//     console.log(`✅ Order created: ${o.name} (id: ${order.id})`);

//     // এখন এই order এর জন্য orderItems তৈরি করি
//     for (const prod of o.products) {
//       const dbProductId = productJsonIdToDbId.get(prod.id as number);

//       if (!dbProductId) {
//         console.warn(
//           `⚠️ Product not found in DB for order "${o.name}", product: "${prod.name}", skipping order item`
//         );
//         continue;
//       }

//       await db.orderItem.create({
//         data: {
//           orderId: order.id,
//           productId: dbProductId,
//           quantity: 1, // JSON orderItems এ quantity আছে, কিন্তু এখানে 1 ধরলাম
//           price: prod.price, // অথবা orderItems থেকে price নিতে পারতে
//         },
//       });

//       console.log(
//         `   ➕ OrderItem created for order "${o.name}" product "${prod.name}"`
//       );
//     }
//   }

//   console.log("🎉 Orders and order items seeded");

//   /**
//    * 5️⃣ Blogs
//    * JSON blogs array থেকে Blog model e seed করব।
//    */

//   for (const b of jsonBlogs) {
//     const existingBlog = await db.blog.findFirst({
//       where: {
//         title: b.title,
//       },
//     });

//     if (existingBlog) {
//       console.log(`ℹ️ Blog already exists, skipping: ${b.title}`);
//       continue;
//     }

//     // date "2024" => new Date("2024") = 2024-01-01
//     const blogDate = new Date(b.date);

//     await db.blog.create({
//       data: {
//         slug: generateSlug(b.title),
//         title: b.title,
//         summary: b.summary,
//         content: "", // এখন content nei, chai le pore manually update
//         date: blogDate,
//         author: b.author,
//         image: b.image,
//       },
//     });

//     console.log(`✅ Blog created: ${b.title}`);
//   }

//   console.log("🎉 Blogs seeded");

//   /**
//    * 6️⃣ Contacts
//    * বর্তমানে Prisma schema তে Contact model নাই,
//    * তাই jsonContacts থেকে কিছুই seed করছি না।
//    * চাইলে Contact model যোগ করলে এই অংশ পরে add করা যাবে।
//    */

//   console.log(
//     "ℹ️ Contacts JSON পাওয়া গেছে, কিন্তু Prisma schema তে Contact model নাই, তাই skip করা হলো।"
//   );
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seed error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await db.$disconnect();
//   });
