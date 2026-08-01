package repo

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TranslationRepo struct {
	DB *pgxpool.Pool
}

type TranslationRecord struct {
	SourceHash             string
	TargetLanguage         string
	ContentFormat          string
	SourceText             string
	TranslatedText         string
	DetectedSourceLanguage string
	Provider               string
}

func (r TranslationRepo) GetMany(
	ctx context.Context,
	hashes []string,
	targetLanguage string,
	contentFormat string,
) (map[string]TranslationRecord, error) {
	result := make(map[string]TranslationRecord, len(hashes))
	if len(hashes) == 0 {
		return result, nil
	}
	rows, err := r.DB.Query(ctx, `
SELECT source_hash, target_language, content_format, source_text, translated_text, detected_source_language, provider
FROM content_translations
WHERE source_hash = ANY($1) AND target_language = $2 AND content_format = $3;`,
		hashes, targetLanguage, contentFormat,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var item TranslationRecord
		if err := rows.Scan(
			&item.SourceHash, &item.TargetLanguage, &item.ContentFormat,
			&item.SourceText, &item.TranslatedText, &item.DetectedSourceLanguage, &item.Provider,
		); err != nil {
			return nil, err
		}
		result[item.SourceHash] = item
	}
	return result, rows.Err()
}

func (r TranslationRepo) UpsertMany(ctx context.Context, records []TranslationRecord) error {
	if len(records) == 0 {
		return nil
	}
	batch := &pgx.Batch{}
	for _, item := range records {
		provider := item.Provider
		if provider == "" {
			provider = "deepl"
		}
		batch.Queue(`
INSERT INTO content_translations (
  source_hash, target_language, content_format, source_text, translated_text,
  detected_source_language, provider
) VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (source_hash, target_language, content_format) DO UPDATE SET
  source_text = EXCLUDED.source_text,
  translated_text = EXCLUDED.translated_text,
  detected_source_language = EXCLUDED.detected_source_language,
  provider = EXCLUDED.provider;`,
			item.SourceHash, item.TargetLanguage, item.ContentFormat, item.SourceText,
			item.TranslatedText, item.DetectedSourceLanguage, provider,
		)
	}
	results := r.DB.SendBatch(ctx, batch)
	defer results.Close()
	for range records {
		if _, err := results.Exec(); err != nil {
			return err
		}
	}
	return nil
}
