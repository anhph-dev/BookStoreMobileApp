const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { getPool, sql } = require('../src/config/db');

const LANGUAGE_LABELS = {
  en: 'Tiếng Anh',
  eng: 'Tiếng Anh',
  vi: 'Tiếng Việt',
  vie: 'Tiếng Việt',
  fre: 'Tiếng Pháp',
  fr: 'Tiếng Pháp',
  ger: 'Tiếng Đức',
  de: 'Tiếng Đức',
  jpn: 'Tiếng Nhật',
  ja: 'Tiếng Nhật',
  kor: 'Tiếng Hàn',
  ko: 'Tiếng Hàn',
  chi: 'Tiếng Trung',
  zh: 'Tiếng Trung',
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanIsbn(value) {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function firstValue(value) {
  return Array.isArray(value) ? value.find(Boolean) : value;
}

function limit(value, length) {
  if (!value) {
    return null;
  }
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, length) : null;
}

function normalizeLanguage(value) {
  const raw = firstValue(value);
  if (!raw) {
    return null;
  }
  const key = String(raw).split('/').pop().toLowerCase();
  return LANGUAGE_LABELS[key] || LANGUAGE_LABELS[String(raw).toLowerCase()] || String(raw);
}

function normalizeDate(value) {
  const text = firstValue(value);
  if (!text) {
    return null;
  }

  const year = String(text).match(/\b(18|19|20)\d{2}\b/)?.[0];
  if (!year) {
    return null;
  }

  const month = String(text).match(/\b(0?[1-9]|1[0-2])\b/)?.[0] || '01';
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BookStoreMobileApp metadata enrichment' },
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOpenLibrary(product) {
  const isbn = cleanIsbn(product.ISBN);
  const book = isbn ? await fetchJson(`https://openlibrary.org/isbn/${isbn}.json`) : null;
  const search = !book
    ? await fetchJson(`https://openlibrary.org/search.json?limit=1&title=${encodeURIComponent(product.ProductName || '')}&author=${encodeURIComponent(product.Author || '')}`)
    : null;
  const doc = book || search?.docs?.[0];

  if (!doc) {
    return {};
  }

  return {
    publisher: limit(firstValue(doc.publishers || doc.publisher), 160),
    language: normalizeLanguage(doc.languages?.[0]?.key || doc.language),
    pageCount: Number(doc.number_of_pages || doc.number_of_pages_median) || null,
    format: limit(firstValue(doc.physical_format) || 'Sách giấy', 80),
    edition: limit(firstValue(doc.edition_name), 120),
    publicationDate: normalizeDate(doc.publish_date || doc.first_publish_year),
    description: limit(typeof doc.description === 'object' ? doc.description.value : doc.description, 4000),
  };
}

async function fetchGoogleBooks(product) {
  const isbn = cleanIsbn(product.ISBN);
  const query = isbn
    ? `isbn:${isbn}`
    : `intitle:${product.ProductName || ''}${product.Author ? ` inauthor:${product.Author}` : ''}`;
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?maxResults=1&q=${encodeURIComponent(query)}`);
  const info = data?.items?.[0]?.volumeInfo;

  if (!info) {
    return {};
  }

  return {
    publisher: limit(info.publisher, 160),
    language: normalizeLanguage(info.language),
    pageCount: Number(info.pageCount) || null,
    format: 'Sách giấy',
    publicationDate: normalizeDate(info.publishedDate),
    description: limit(info.description, 4000),
  };
}

function mergeMetadata(current, ...sources) {
  const merged = {};
  for (const key of ['publisher', 'language', 'pageCount', 'format', 'edition', 'publicationDate', 'description']) {
    merged[key] = current[key] || sources.map((source) => source[key]).find(Boolean) || null;
  }
  merged.format = merged.format || 'Sách giấy';
  merged.edition = merged.edition || 'Ấn bản tiêu chuẩn';
  merged.publicationDate = merged.publicationDate || normalizeDate(current.description);
  return merged;
}

async function updateProduct(pool, product, metadata) {
  await pool.request()
    .input('productId', sql.Int, product.ProductId)
    .input('publisher', sql.NVarChar, metadata.publisher)
    .input('language', sql.NVarChar, metadata.language)
    .input('pageCount', sql.Int, metadata.pageCount)
    .input('format', sql.NVarChar, metadata.format)
    .input('edition', sql.NVarChar, metadata.edition)
    .input('publicationDate', sql.Date, metadata.publicationDate)
    .input('description', sql.NVarChar(sql.MAX), metadata.description)
    .query(`
      UPDATE Products
      SET Publisher = COALESCE(NULLIF(Publisher, ''), @publisher),
          [Language] = COALESCE(NULLIF([Language], ''), @language),
          [PageCount] = COALESCE([PageCount], @pageCount),
          [Format] = COALESCE(NULLIF([Format], ''), @format),
          [Edition] = COALESCE(NULLIF([Edition], ''), @edition),
          [PublicationDate] = COALESCE([PublicationDate], @publicationDate),
          Description = CASE
            WHEN Description IS NULL OR DATALENGTH(Description) = 0 THEN @description
            ELSE Description
          END
      WHERE ProductId = @productId;
    `);
}

async function main() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT ProductId, ProductName, ISBN, Author, Publisher, [Language], [PageCount],
           [Format], [Edition], [PublicationDate], Description
    FROM Products
    WHERE IsDiscontinued = 0
    ORDER BY ProductId;
  `);

  let updated = 0;
  let skipped = 0;

  for (const product of result.recordset) {
    const current = {
      publisher: product.Publisher,
      language: product.Language,
      pageCount: product.PageCount,
      format: product.Format,
      edition: product.Edition,
      publicationDate: product.PublicationDate,
      description: product.Description,
    };

    const needsMetadata = Object.values(current).some((value) => value === null || value === undefined || value === '');
    if (!needsMetadata) {
      skipped += 1;
      continue;
    }

    const openLibrary = await fetchOpenLibrary(product);
    await wait(150);
    const googleBooks = await fetchGoogleBooks(product);
    const metadata = mergeMetadata(current, openLibrary, googleBooks);

    await updateProduct(pool, product, metadata);
    updated += 1;
    console.log(`UPDATED ${product.ProductId}: ${product.ProductName}`);
    await wait(250);
  }

  console.log(`BOOK_METADATA_ENRICH_OK updated=${updated} skipped=${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
