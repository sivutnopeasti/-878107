# Pohjanmaan Viherrakennus - Työhallintajärjestelmä

Työntekijöiden työhallintajärjestelmä, jolla hallitaan urakoita, työtunteja ja palkkoja.

## Ominaisuudet

- **Kirjautuminen nimellä** – yksinkertainen kirjautuminen omalla nimellä
- **Admin-hallinta** – urakoiden lisäys, työntekijöiden hallinta, tuntipalkkojen seuranta
- **Työtuntien kirjaus** – työntekijä valitsee urakan ja kirjaa omat työtuntinsa
- **Automaattinen tuntipalkkalaskenta** – urakan arvo / kaikki tehdyt työtunnit

## Teknologiat

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript
- JSON-tiedostopohjainen tallennus

## Deploy Renderiin

1. Luo tili osoitteessa [render.com](https://render.com)
2. Valitse **New > Blueprint** ja yhdistä tämä GitHub-repo
3. Render lukee `render.yaml`-tiedoston ja luo web-palvelun automaattisesti
4. Admin-käyttäjä luodaan automaattisesti ensimmäisellä käynnistyksellä

## Paikallinen kehitys

```bash
npm install
npm run dev
```

Sovellus käynnistyy osoitteeseen [http://localhost:3000](http://localhost:3000).

## Käyttö

1. **Admin-kirjautuminen**: Kirjaudu nimellä "Admin"
2. **Lisää työntekijöitä**: Admin-paneelissa "Työntekijät"-välilehdeltä
3. **Lisää urakoita**: Admin-paneelissa "Urakat"-välilehdeltä
4. **Aseta urakan arvo**: Klikkaa urakan arvoa muokataksesi
5. **Työntekijän kirjautuminen**: Työntekijä kirjautuu omalla nimellään
6. **Työtuntien lisäys**: Työntekijä valitsee urakan ja lisää tuntinsa

## Tuntipalkkalaskenta

```
Tuntipalkka = Urakan arvo (€) / Kaikki urakan työtunnit yhteensä (h)
```

Tuntipalkka on sama kaikille urakan työntekijöille.
