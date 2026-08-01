package router

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"maplehub/internal/config"
	"maplehub/internal/http/handlers"
	"maplehub/internal/http/middleware"
	"maplehub/internal/repo"
	"maplehub/internal/staticcontent"
	"maplehub/internal/translation"
)

type Deps struct {
	Cfg config.Config
	DB  *pgxpool.Pool
}

func New(d Deps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:   "maplehub-api",
		BodyLimit: 50 * 1024 * 1024,
	})
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     d.Cfg.CORSAllowOrigins,
		AllowHeaders:     "Authorization,Content-Type",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowCredentials: true,
	}))
	app.Use(logger.New())

	app.Get("/healthz", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true}) })

	authRepo := repo.AuthRepo{DB: d.DB}
	wikiRepo := repo.WikiRepo{DB: d.DB}
	wikiMirrorRepo := repo.WikiMirrorRepo{DB: d.DB}
	tenantRepo := repo.TenantRepo{DB: d.DB}
	communityRepo := repo.CommunityRepo{DB: d.DB}
	guideRepo := repo.GuideRepo{DB: d.DB}
	notifRepo := repo.NotificationRepo{DB: d.DB}
	newsletterRepo := repo.NewsletterRepo{DB: d.DB}
	tenantLookupRepo := repo.TenantLookupRepo{DB: d.DB}
	realtimeContentRepo := repo.RealtimeContentRepo{DB: d.DB}
	staticContentRepo := repo.StaticContentRepo{DB: d.DB}
	translationRepo := repo.TranslationRepo{DB: d.DB}
	characterRepo := repo.CharacterRepo{DB: d.DB}
	accountDataRepo := repo.AccountDataRepo{DB: d.DB}
	telemetryRepo := repo.TelemetryRepo{DB: d.DB}
	feedbackRepo := repo.FeedbackRepo{DB: d.DB}

	authH := handlers.AuthHandler{Cfg: d.Cfg, Repo: authRepo}
	wikiH := handlers.WikiHandler{Repo: wikiRepo}
	wikiMirrorH := handlers.WikiMirrorHandler{Repo: wikiMirrorRepo}
	tenantH := handlers.TenantHandler{Repo: tenantRepo}
	communityH := handlers.CommunityHandler{Repo: communityRepo}
	guideH := handlers.GuideHandler{Repo: guideRepo}
	notifH := handlers.NotificationHandler{Repo: notifRepo}
	newsletterH := handlers.NewsletterHandler{LookupRepo: tenantLookupRepo, Repo: newsletterRepo}
	realtimeContentH := handlers.RealtimeContentHandler{Repo: realtimeContentRepo}
	staticContentService := staticcontent.New(staticContentRepo)
	officialContentH := handlers.NewOfficialContentHandler(staticContentService)
	staticContentH := handlers.StaticContentHandler{Service: staticContentService}
	translationService := translation.New(translationRepo, translation.Options{
		Provider:             d.Cfg.TranslationProvider,
		DeepLAuthKey:         d.Cfg.DeepLAuthKey,
		DeepLAPIURL:          d.Cfg.DeepLAPIURL,
		LibreTranslateAPIURL: d.Cfg.LibreTranslateAPIURL,
		LibreTranslateAPIKey: d.Cfg.LibreTranslateAPIKey,
		OllamaAPIURL:         d.Cfg.OllamaAPIURL,
		OllamaModel:          d.Cfg.OllamaModel,
	})
	translationH := handlers.TranslationHandler{Service: translationService}
	characterH := handlers.CharacterHandler{Repo: characterRepo}
	accountDataH := handlers.AccountDataHandler{Repo: accountDataRepo}
	telemetryH := handlers.TelemetryHandler{Repo: telemetryRepo, HashSecret: d.Cfg.AnalyticsHashSecret}
	feedbackH := handlers.FeedbackHandler{LookupRepo: tenantLookupRepo, Repo: feedbackRepo}

	api := app.Group("/api")
	public := api.Group("", middleware.RateLimit(100, time.Minute))

	// auth
	public.Post("/auth/signup", authH.Signup)
	public.Post("/auth/login", authH.Login)
	public.Post("/auth/google", authH.Google)
	public.Post("/auth/refresh", authH.Refresh)
	public.Post("/auth/logout", authH.Logout)

	// newsletter (public)
	public.Post("/newsletter/subscribe", newsletterH.Subscribe)
	public.Post("/newsletter/unsubscribe", newsletterH.Unsubscribe)
	public.Post("/telemetry/events", telemetryH.Collect)
	public.Post("/feedback", feedbackH.Create)

	// mirrored public wiki
	public.Get("/wiki/mirror/sources", wikiMirrorH.ListSources)
	public.Get("/wiki/mirror/pages", wikiMirrorH.ListPages)
	public.Get("/wiki/mirror/pages/by-title", wikiMirrorH.GetPageByTitle)
	public.Get("/wiki/mirror/reclassify/status", wikiMirrorH.ReclassifyStatus)
	public.Get("/wiki/mirror/reparse/status", wikiMirrorH.ReparseStatus)
	public.Get("/wiki/mirror/pages/:sourceKey/:sourcePageId", wikiMirrorH.GetPage)
	public.Get("/wiki/mirror/sync", wikiMirrorH.ListSyncStates)
	public.Get("/realtime/content", realtimeContentH.Get)
	public.Get("/static-content", staticContentH.Get)
	public.Post("/static-content", staticContentH.Post)
	public.Post("/translations", translationH.Translate)
	public.Get("/official-content/:server/:kind", officialContentH.Get)
	public.Get("/official-content/article", officialContentH.Article)

	// protected
	protected := api.Group("", middleware.AuthRequired(d.Cfg.JWTSecret), middleware.RateLimit(500, time.Minute))
	protected.Get("/me", authH.Me)
	protected.Get("/player-data", accountDataH.Get)
	protected.Put("/player-data", accountDataH.Put)

	// tenants (example: require admin)
	protected.Get("/tenants", middleware.RequirePermission(d.DB, "user:admin"), tenantH.ListTenants)

	// newsletter admin
	protected.Get("/newsletter/subscribers", middleware.RequirePermission(d.DB, "user:admin"), newsletterH.ListSubscribers)
	protected.Get("/telemetry/dashboard", middleware.RequirePermission(d.DB, "user:admin"), telemetryH.Dashboard)
	protected.Get("/admin/feedback", middleware.RequirePermission(d.DB, "feedback:admin"), feedbackH.List)
	protected.Patch("/admin/feedback/:feedbackId", middleware.RequirePermission(d.DB, "feedback:admin"), feedbackH.Update)

	// Content imports and mirror mutations are trusted operations only.
	protected.Post("/realtime/content", middleware.RequirePermission(d.DB, "wiki:write"), realtimeContentH.Upsert)
	protected.Post("/wiki/mirror/pages/reclassify", middleware.RequirePermission(d.DB, "wiki:write"), wikiMirrorH.ReclassifyPages)
	protected.Post("/wiki/mirror/pages/reparse", middleware.RequirePermission(d.DB, "wiki:write"), wikiMirrorH.ReparseCorruptedPages)
	protected.Post("/wiki/mirror/sync", middleware.RequirePermission(d.DB, "wiki:write"), wikiMirrorH.StartSync)
	protected.Post("/wiki/mirror/import", middleware.RequirePermission(d.DB, "wiki:write"), wikiMirrorH.BatchImport)

	// wiki
	protected.Get("/wiki/spaces", middleware.RequirePermission(d.DB, "wiki:read"), wikiH.ListSpaces)
	protected.Post("/wiki/spaces", middleware.RequirePermission(d.DB, "wiki:write"), wikiH.CreateSpace)
	protected.Get("/wiki/spaces/:spaceId/pages", middleware.RequirePermission(d.DB, "wiki:read"), wikiH.ListPages)
	protected.Post("/wiki/spaces/:spaceId/pages", middleware.RequirePermission(d.DB, "wiki:write"), wikiH.CreatePage)
	protected.Get("/wiki/pages/:pageId", middleware.RequirePermission(d.DB, "wiki:read"), wikiH.GetPage)
	protected.Put("/wiki/pages/:pageId", middleware.RequirePermission(d.DB, "wiki:write"), wikiH.UpdatePage)
	protected.Post("/wiki/pages/:pageId/revisions", middleware.RequirePermission(d.DB, "wiki:write"), wikiH.CreateRevision)

	// community proposals
	protected.Get("/community/proposals", middleware.RequirePermission(d.DB, "wiki:read"), communityH.ListProposals)
	protected.Post("/community/proposals", middleware.RequirePermission(d.DB, "wiki:write"), communityH.CreateProposal)
	protected.Post("/community/proposals/:proposalId/vote", middleware.RequirePermission(d.DB, "wiki:read"), communityH.VoteProposal)
	protected.Get("/community/proposals/:proposalId/comments", middleware.RequirePermission(d.DB, "wiki:read"), communityH.ListProposalComments)
	protected.Post("/community/proposals/:proposalId/comments", middleware.RequirePermission(d.DB, "wiki:read"), communityH.AddProposalComment)

	// guide comments
	protected.Get("/guides/:guideId/comments", middleware.RequirePermission(d.DB, "wiki:read"), guideH.ListComments)
	protected.Post("/guides/:guideId/comments", middleware.RequirePermission(d.DB, "wiki:read"), guideH.AddComment)
	protected.Post("/guides/comments/:commentId/vote", middleware.RequirePermission(d.DB, "wiki:read"), guideH.VoteComment)

	// guide bookmarks / likes
	protected.Get("/guides/bookmarks", middleware.RequirePermission(d.DB, "wiki:read"), guideH.ListBookmarks)
	protected.Get("/guides/likes", middleware.RequirePermission(d.DB, "wiki:read"), guideH.ListLikes)
	protected.Get("/guides/:guideId/bookmark", middleware.RequirePermission(d.DB, "wiki:read"), guideH.GetBookmark)
	protected.Post("/guides/:guideId/bookmark", middleware.RequirePermission(d.DB, "wiki:read"), guideH.SetBookmark)
	protected.Get("/guides/:guideId/like", middleware.RequirePermission(d.DB, "wiki:read"), guideH.GetLike)
	protected.Post("/guides/:guideId/like", middleware.RequirePermission(d.DB, "wiki:read"), guideH.SetLike)
	protected.Get("/guides/:guideId/like/count", middleware.RequirePermission(d.DB, "wiki:read"), guideH.LikeCount)

	// notifications
	protected.Get("/notifications", middleware.RequirePermission(d.DB, "wiki:read"), notifH.List)
	protected.Post("/notifications/mark_all_read", middleware.RequirePermission(d.DB, "wiki:read"), notifH.MarkAllRead)
	protected.Post("/notifications/:id/read", middleware.RequirePermission(d.DB, "wiki:read"), notifH.MarkRead)

	// character profiles & checklist
	protected.Get("/characters", middleware.RequirePermission(d.DB, "wiki:read"), characterH.ListCharacters)
	protected.Post("/characters", middleware.RequirePermission(d.DB, "wiki:read"), characterH.CreateCharacter)
	protected.Put("/characters/:charId", middleware.RequirePermission(d.DB, "wiki:read"), characterH.UpdateCharacter)
	protected.Delete("/characters/:charId", middleware.RequirePermission(d.DB, "wiki:read"), characterH.DeleteCharacter)
	protected.Get("/characters/:charId/checklist", middleware.RequirePermission(d.DB, "wiki:read"), characterH.GetChecklist)
	protected.Put("/characters/:charId/checklist", middleware.RequirePermission(d.DB, "wiki:read"), characterH.UpdateChecklist)

	workerCtx, stopWorker := context.WithCancel(context.Background())
	app.Hooks().OnShutdown(func() error {
		stopWorker()
		return nil
	})
	go staticContentService.Run(workerCtx)

	return app
}
