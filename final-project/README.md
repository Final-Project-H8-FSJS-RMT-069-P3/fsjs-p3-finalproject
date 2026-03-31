This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


notes baru for pendengarMu:
- Doctor QOL:
  - Overview berapa income dan berapa pasien yang telah di handle
  - Email untuk notifikasi booking baru (saat pencet link dari email redirect ke formBrief pasien itu)
  - Halaman set up Jadwal available dokter
- Penampilan:
  - Video call button sesi tidak bisa dilihat di mobile
  - Card penampilan dokter di home page dikecilkan
  - BookingForm kasih radio untuk fitur a b c link harga ke fitur, harga tidak bisa diganti selain dari radio
  - Payment fetch detail dokter yang dibayar
  - Navbar Recomp, logout and profile page link in dropdown
  - Saat end call ganti alert bawaan browser jadi toastify atau swal
  - Floating window sebelom booking ilangin waktunya
- Backend (maybe)
  - Table / column baru untuk user yang dokter yang berisi dengan foto dokter, specialized in, jadwal, harga + colok ke frontend yang udah ada
  - Conditional untuk masuk sesi, contoh jika pilih sesi videocall bisa akses chat juga tapi kalo hannya chat cuman bisa akses chatnya saja penampilannya juga beda, disini juga kita ada code yang tidak kepakai yaitu code viyan chatbot, bisa bikin konsul chatbot sebagai fitur tambahan dan additional pricing sebelum ketemu dokter
  - Jika ditambahkan email dokter, sekalian tambahkan email ke user setelah booking untuk konfirmasi.