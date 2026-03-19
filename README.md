# Pohjanmaan Viherrakennus - Työhallintajärjestelmä

Työntekijöiden työhallintajärjestelmä, jolla hallitaan urakoita, työtunteja ja palkkoja.

## Ominaisuudet

- **Kirjautuminen nimellä** – yksinkertainen kirjautuminen omalla nimellä
- **Admin-hallinta** – urakoiden lisäys, työntekijöiden hallinta, tuntipalkkojen seuranta
- **Työtuntien kirjaus** – työntekijä valitsee urakan ja kirjaa omat työtuntinsa
- **Automaattinen tuntipalkkalaskenta** – urakan arvo / kaikki tehdyt työtunnit

## Teknologiat

- [Next.js](https://nextjs.org/) (App Router)
- [Prisma](https://www.prisma.io/) + SQLite
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## Asennus ja käynnistys

```bash
# Asenna riippuvuudet
npm install

# Luo tietokanta ja generoi Prisma client
npx prisma db push

# Luo Admin-käyttäjä (seed)
npm run db:seed

# Käynnistä kehityspalvelin
npm run dev
```

Sovellus käynnistyy osoitteeseen [http://localhost:3000](http://localhost:3000).

## Käyttö

1. **Admin-kirjautuminen**: Kirjaudu nimellä "Admin"
2. **Lisää työntekijöitä**: Admin-paneelissa "Työntekijät"-välilehdeltä
3. **Lisää urakoita**: Admin-paneelissa "Urakat"-välilehdeltä
4. **Aseta urakan arvo**: Klikkaa urakan "Ei asetettu" tai euromäärää muokataksesi
5. **Työntekijän kirjautuminen**: Työntekijä kirjautuu omalla nimellään
6. **Työtuntien lisäys**: Työntekijä valitsee urakan ja lisää tuntinsa

## Tuntipalkkalaskenta

Tuntipalkka lasketaan kaavalla:

```
Tuntipalkka = Urakan arvo (€) / Kaikki urakan työtunnit yhteensä (h)
```

Tuntipalkka on sama kaikille urakan työntekijöille.
