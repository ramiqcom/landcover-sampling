This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Features

- Multiple basemap to help landcover sampling interpretation
- User data management continue working because data is stored in the database.
- Generate multispectral images
  user can choose which band to visualize. this is useful when we try to identify a landcover, for example, to differentiate swamp is easier using NIR(B5), SWIR1(B6), SWIR2(B7) composite while to differentiate urban area is easier using SWIR2, SWIR1, and NIR.
  user can choose year and region
- Validasi: To assist user to measure accuracy / confusion matrix of the prediction
  - [x] Landcover yang mau divalidasi di hardcode di aplikasi (asset nya di EE, list region dan tahunnya di list down di app)
  - [x] User pilih region dan tahunnya
  - [x] Generate sample for the selected landcover prediction
  - [x] For each point user can label the class
  - [ ] There is a button to generate confusion matrix and accuracy
- Labeling => pake cluster dari B5, B6, B7

## Tech Stack

- Next.js Front end
  - leaflet component to show map
- Google Storage: store user samples (geojson)
- BigQuery: store account and project
- GEE: generate sample and generate image

### Domains
Project
- session records what user currently works on (region, year, sample, and visualization configuration)

Landcover prediction Asset (Region And Year)
- which GEE asset filtered by region and year

Sample
- nge link ke landcover prediction (region and year)
- user
- list of points

Points
- long
- lat
- lulc (dari prediction assets)
- value validation (dari user)

Image
- earth engine assets yang di visualisasikan ke client
- channel region dan year
