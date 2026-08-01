package handlers

import (
	"context"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/contentsecurity"
	"maplehub/internal/repo"
	wikimirror "maplehub/internal/wiki_mirror"
)

type WikiMirrorHandler struct {
	Repo repo.WikiMirrorRepo
}

func (h WikiMirrorHandler) ListPages(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()

	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	var namespace *int
	if namespaceParam := c.Query("namespace"); namespaceParam != "" && namespaceParam != "all" {
		parsedNamespace, err := strconv.Atoi(namespaceParam)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid namespace")
		}
		namespace = &parsedNamespace
	}
	items, err := h.Repo.ListPages(ctx, repo.WikiMirrorListOptions{
		Query:     c.Query("q"),
		Category:  c.Query("category"),
		SourceKey: c.Query("source"),
		Namespace: namespace,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list mirrored wiki pages failed")
	}
	return c.JSON(items)
}

func (h WikiMirrorHandler) GetPageByTitle(c *fiber.Ctx) error {
	title := c.Query("title")
	if title == "" {
		return fiber.NewError(fiber.StatusBadRequest, "title query parameter is required")
	}
	sourceKey := c.Query("source")

	var namespace *int
	if ns := c.Query("namespace"); ns != "" {
		parsed, err := strconv.Atoi(ns)
		if err == nil {
			namespace = &parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()

	item, err := h.Repo.GetPageByTitle(ctx, sourceKey, title, namespace)
	if err != nil {
		return fiber.ErrNotFound
	}
	return c.JSON(item)
}

func (h WikiMirrorHandler) GetPage(c *fiber.Ctx) error {
	sourceKey := c.Params("sourceKey")
	sourcePageID, err := strconv.ParseInt(c.Params("sourcePageId"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid source page id")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()

	item, err := h.Repo.GetPage(ctx, sourceKey, sourcePageID)
	if err != nil {
		return fiber.ErrNotFound
	}
	return c.JSON(item)
}

func (h WikiMirrorHandler) ListSources(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	items, err := h.Repo.ListSources(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list mirrored wiki sources failed")
	}
	return c.JSON(items)
}

func (h WikiMirrorHandler) ListSyncStates(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	items, err := h.Repo.ListSyncStates(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list mirrored wiki sync states failed")
	}
	return c.JSON(items)
}

func (h WikiMirrorHandler) StartSync(c *fiber.Ctx) error {
	maxPages, _ := strconv.Atoi(c.Query("max_pages", "0"))
	sourceKey := c.Query("source")
	syncer := wikimirror.Syncer{Repo: h.Repo}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 24*time.Hour)
		defer cancel()
		_ = syncer.Sync(ctx, wikimirror.SyncOptions{SourceKey: sourceKey, MaxPages: maxPages})
	}()

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"ok":        true,
		"source":    sourceKey,
		"max_pages": maxPages,
	})
}

type browserImportPage struct {
	SourcePageID int64    `json:"source_page_id"`
	Namespace    int      `json:"namespace"`
	Title        string   `json:"title"`
	ContentText  string   `json:"content_text"`
	ContentHTML  string   `json:"content_html"`
	Tags         []string `json:"tags"`
	SourceURL    string   `json:"source_url"`
	RevisionID   *int64   `json:"revision_id"`
}

func (h WikiMirrorHandler) BatchImport(c *fiber.Ctx) error {
	sourceKey := c.Query("source", "mswiki")
	source, sourceExists := wikimirror.FindSource(sourceKey)
	if !sourceExists {
		return fiber.NewError(fiber.StatusBadRequest, "unknown wiki source")
	}
	if len(c.Body()) > 5*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "wiki import exceeds 5 MB")
	}
	var pages []browserImportPage
	if err := strictJSON(c.Body(), &pages); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON body")
	}
	if len(pages) == 0 {
		return c.JSON(fiber.Map{"ok": true, "imported": 0})
	}
	if len(pages) > 500 {
		return fiber.NewError(fiber.StatusBadRequest, "wiki import batch exceeds 500 pages")
	}
	sourceURL, _ := url.Parse(source.PageURLBase)
	for index := range pages {
		page := &pages[index]
		page.Title = strings.TrimSpace(page.Title)
		if page.SourcePageID <= 0 || page.Title == "" || len(page.Title) > 500 || len(page.ContentText) > 2*1024*1024 || len(page.ContentHTML) > 2*1024*1024 {
			return fiber.NewError(fiber.StatusBadRequest, "wiki import contains an invalid or oversized page")
		}
		if err := contentsecurity.ValidateSourceURL(page.SourceURL); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "wiki import source URL is not allowed")
		}
		pageURL, _ := url.Parse(page.SourceURL)
		if !strings.EqualFold(pageURL.Hostname(), sourceURL.Hostname()) {
			return fiber.NewError(fiber.StatusBadRequest, "wiki import source host does not match source key")
		}
		page.ContentHTML = contentsecurity.SanitizeHTML(page.ContentHTML)
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Minute)
	defer cancel()

	imported := 0
	var errors []string
	for _, p := range pages {
		if p.Title == "" {
			continue
		}
		slug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(p.Title), " ", "-"))
		category := wikimirror.ClassifyPage(p.Title, p.Tags, p.ContentText, p.Namespace)
		wordCount := len(strings.Fields(p.ContentText))

		input := repo.WikiMirrorPageInput{
			SourceKey:    sourceKey,
			SourcePageID: p.SourcePageID,
			Namespace:    p.Namespace,
			Title:        p.Title,
			Slug:         slug,
			Category:     category,
			SourceURL:    p.SourceURL,
			Extract:      truncate(p.ContentText, 500),
			ContentText:  p.ContentText,
			ContentHTML:  p.ContentHTML,
			WordCount:    wordCount,
			RevisionID:   p.RevisionID,
			Tags:         p.Tags,
		}
		if _, err := h.Repo.UpsertPage(ctx, input); err != nil {
			errors = append(errors, p.Title+": "+err.Error())
		} else {
			imported++
		}
	}

	return c.JSON(fiber.Map{
		"ok":       true,
		"received": len(pages),
		"imported": imported,
		"errors":   errors,
	})
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

// reclassifyState tracks the progress of a background reclassify job.
var reclassifyState struct {
	Running   bool   `json:"running"`
	Processed int    `json:"processed"`
	Updated   int    `json:"updated"`
	Total     int    `json:"total"`
	Status    string `json:"status"`
}

func (h WikiMirrorHandler) ReclassifyPages(c *fiber.Ctx) error {
	if reclassifyState.Running {
		return c.JSON(fiber.Map{
			"ok":        false,
			"running":   true,
			"processed": reclassifyState.Processed,
			"updated":   reclassifyState.Updated,
			"total":     reclassifyState.Total,
			"status":    reclassifyState.Status,
		})
	}

	sourceKey := c.Query("source", "mswiki")
	batchSize, _ := strconv.Atoi(c.Query("batch_size", "500"))
	if batchSize <= 0 || batchSize > 2000 {
		batchSize = 500
	}
	dryRun, _ := strconv.ParseBool(c.Query("dry_run", "false"))

	reclassifyState = struct {
		Running   bool   `json:"running"`
		Processed int    `json:"processed"`
		Updated   int    `json:"updated"`
		Total     int    `json:"total"`
		Status    string `json:"status"`
	}{Running: true, Status: "running"}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()

		processed := 0
		updated := 0
		offset := 0

		for {
			pages, err := h.Repo.LoadPagesForReclassify(ctx, sourceKey, batchSize, offset)
			if err != nil {
				reclassifyState = struct {
					Running   bool   `json:"running"`
					Processed int    `json:"processed"`
					Updated   int    `json:"updated"`
					Total     int    `json:"total"`
					Status    string `json:"status"`
				}{Running: false, Processed: processed, Updated: updated, Status: "error: " + err.Error()}
				return
			}
			if len(pages) == 0 {
				break
			}

			var updates []repo.CategoryUpdate
			for _, p := range pages {
				newCat := wikimirror.ClassifyPage(p.Title, p.Tags, p.Content, p.Namespace)
				if newCat != p.Category {
					updates = append(updates, repo.CategoryUpdate{ID: p.ID, Category: newCat})
				}
			}

			if !dryRun && len(updates) > 0 {
				n, err := h.Repo.BatchUpdateCategories(ctx, updates)
				if err != nil {
					reclassifyState = struct {
						Running   bool   `json:"running"`
						Processed int    `json:"processed"`
						Updated   int    `json:"updated"`
						Total     int    `json:"total"`
						Status    string `json:"status"`
					}{Running: false, Processed: processed, Updated: updated, Status: "error: " + err.Error()}
					return
				}
				updated += int(n)
			} else {
				updated += len(updates)
			}

			processed += len(pages)
			reclassifyState = struct {
				Running   bool   `json:"running"`
				Processed int    `json:"processed"`
				Updated   int    `json:"updated"`
				Total     int    `json:"total"`
				Status    string `json:"status"`
			}{Running: true, Processed: processed, Updated: updated, Status: "running"}

			if len(pages) < batchSize {
				break
			}
			offset += batchSize
		}

		status := "completed"
		if dryRun {
			status = "completed (dry run)"
		}
		reclassifyState = struct {
			Running   bool   `json:"running"`
			Processed int    `json:"processed"`
			Updated   int    `json:"updated"`
			Total     int    `json:"total"`
			Status    string `json:"status"`
		}{Running: false, Processed: processed, Updated: updated, Status: status}
	}()

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"ok":         true,
		"source":     sourceKey,
		"batch_size": batchSize,
		"dry_run":    dryRun,
	})
}

func (h WikiMirrorHandler) ReclassifyStatus(c *fiber.Ctx) error {
	return c.JSON(reclassifyState)
}

// reparseState tracks the progress of a background reparse job.
var reparseState struct {
	Running bool   `json:"running"`
	Scanned int    `json:"scanned"`
	Fixed   int    `json:"fixed"`
	Failed  int    `json:"failed"`
	Status  string `json:"status"`
}

func (h WikiMirrorHandler) ReparseCorruptedPages(c *fiber.Ctx) error {
	if reparseState.Running {
		return c.JSON(fiber.Map{
			"ok":      false,
			"running": true,
			"scanned": reparseState.Scanned,
			"fixed":   reparseState.Fixed,
			"failed":  reparseState.Failed,
			"status":  reparseState.Status,
		})
	}

	sourceKey := c.Query("source", "mswiki")
	batchSize, _ := strconv.Atoi(c.Query("batch_size", "200"))
	if batchSize <= 0 || batchSize > 1000 {
		batchSize = 200
	}

	reparseState = struct {
		Running bool   `json:"running"`
		Scanned int    `json:"scanned"`
		Fixed   int    `json:"fixed"`
		Failed  int    `json:"failed"`
		Status  string `json:"status"`
	}{Running: true, Status: "running"}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 4*time.Hour)
		defer cancel()

		syncer := wikimirror.Syncer{Repo: h.Repo}
		source, ok := wikimirror.FindSource(sourceKey)
		if !ok {
			reparseState = struct {
				Running bool   `json:"running"`
				Scanned int    `json:"scanned"`
				Fixed   int    `json:"fixed"`
				Failed  int    `json:"failed"`
				Status  string `json:"status"`
			}{Running: false, Status: "error: unknown source " + sourceKey}
			return
		}

		scanned := 0
		fixed := 0
		failed := 0
		offset := 0

		for {
			pages, err := h.Repo.LoadCorruptedPages(ctx, sourceKey, batchSize, offset)
			if err != nil {
				reparseState = struct {
					Running bool   `json:"running"`
					Scanned int    `json:"scanned"`
					Fixed   int    `json:"fixed"`
					Failed  int    `json:"failed"`
					Status  string `json:"status"`
				}{Running: false, Scanned: scanned, Fixed: fixed, Failed: failed, Status: "error: " + err.Error()}
				return
			}
			if len(pages) == 0 {
				break
			}

			for _, p := range pages {
				if err := ctx.Err(); err != nil {
					reparseState = struct {
						Running bool   `json:"running"`
						Scanned int    `json:"scanned"`
						Fixed   int    `json:"fixed"`
						Failed  int    `json:"failed"`
						Status  string `json:"status"`
					}{Running: false, Scanned: scanned, Fixed: fixed, Failed: failed, Status: "cancelled"}
					return
				}

				parsed, err := syncer.FetchParsedPage(ctx, source, p.Title)
				if err != nil {
					failed++
					scanned++
					reparseState = struct {
						Running bool   `json:"running"`
						Scanned int    `json:"scanned"`
						Fixed   int    `json:"fixed"`
						Failed  int    `json:"failed"`
						Status  string `json:"status"`
					}{Running: true, Scanned: scanned, Fixed: fixed, Failed: failed, Status: "running"}
					time.Sleep(500 * time.Millisecond)
					continue
				}

				wordCount := len(strings.Fields(parsed.Text))
				extract := truncate(parsed.Text, 500)
				if err := h.Repo.UpdatePageHTMLContent(ctx, p.ID, parsed.HTML, parsed.Text, extract, wordCount); err != nil {
					failed++
				} else {
					fixed++
				}
				scanned++

				reparseState = struct {
					Running bool   `json:"running"`
					Scanned int    `json:"scanned"`
					Fixed   int    `json:"fixed"`
					Failed  int    `json:"failed"`
					Status  string `json:"status"`
				}{Running: true, Scanned: scanned, Fixed: fixed, Failed: failed, Status: "running"}

				// Rate-limit MediaWiki API calls
				time.Sleep(150 * time.Millisecond)
			}

			// Since we update pages in-place (not inserting new rows), and we process
			// by scanning forward, pages we fixed no longer match the corruption query.
			// Use offset 0 when pages returned equals batch size (some may still be unfixed).
			if len(pages) < batchSize {
				break
			}
			// Don't advance offset: fixed pages no longer match the query, so the next
			// batch at the same offset is actually new unfixed rows.
		}

		reparseState = struct {
			Running bool   `json:"running"`
			Scanned int    `json:"scanned"`
			Fixed   int    `json:"fixed"`
			Failed  int    `json:"failed"`
			Status  string `json:"status"`
		}{Running: false, Scanned: scanned, Fixed: fixed, Failed: failed, Status: "completed"}
	}()

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"ok":         true,
		"source":     sourceKey,
		"batch_size": batchSize,
	})
}

func (h WikiMirrorHandler) ReparseStatus(c *fiber.Ctx) error {
	return c.JSON(reparseState)
}
