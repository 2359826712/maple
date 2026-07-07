import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { videoCards, communityHighlights } from '@/mocks/home';
import { communityLinks } from '@/constants/communityLinks';

export default function VideoAndCommunity() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();

  const filteredVideos = videoCards.filter((v) => v.versions.includes(versionInfo.id));

  return (
    <section id="community" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Video section */}
          <div className="xl:col-span-2">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                  {t('video_title_eyebrow')}
                </div>
                <h2 className="mt-2 font-heading text-2xl md:text-3xl font-semibold text-foreground-950">
                  {t('video_title')}
                </h2>
              </div>
              <a
                href="https://www.youtube.com/user/MapleStory"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-primary-700 hover:text-primary-800 cursor-pointer whitespace-nowrap"
              >
                {t('video_view_channel')} <i className="ri-arrow-right-line"></i>
              </a>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="text-center py-16 text-foreground-600">
                <i className="ri-vidicon-line text-4xl mb-3 block"></i>
                <p className="text-lg font-semibold">No videos for {versionInfo.shortLabel} yet</p>
                <p className="text-sm mt-1">Switch versions to see update analysis videos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredVideos.map((v, i) => (
                  <a
                    key={v.id}
                    href={v.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`group relative rounded-xl overflow-hidden border border-background-200 bg-background-50 ${
                      i === 0 ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className={`relative overflow-hidden ${i === 0 ? 'h-64' : 'h-40'}`}>
                      <img
                        src={v.thumb}
                        alt={v.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/60 via-transparent to-transparent"></div>
                      <span className="absolute inset-0 flex items-center justify-center cursor-pointer">
                        <span className="w-14 h-14 rounded-full bg-background-50/95 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-background-50 transition-colors">
                          <i className="ri-play-fill text-2xl text-primary-700 group-hover:text-background-50"></i>
                        </span>
                      </span>
                      <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-foreground-950/70 text-background-50 text-[11px] font-semibold">
                        {v.sourceLabel}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className={`font-heading font-semibold text-foreground-950 ${i === 0 ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}>
                        {v.title}
                      </h3>
                      <div className="mt-2 flex items-center justify-between text-xs text-foreground-600">
                        <span className="flex items-center gap-1">
                          <i className="ri-user-voice-line"></i> {v.channel}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-youtube-line"></i> {v.views}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Community sidebar */}
          <div className="rounded-xl border border-background-200 bg-background-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-semibold text-accent-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-accent-600 text-[10px]"></i>
                  {t('community_title_eyebrow')}
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground-950 mt-1">
                  {t('community_title')}
                </h3>
              </div>
              <span className="w-10 h-10 rounded-lg bg-accent-500 text-background-50 flex items-center justify-center">
                <i className="ri-chat-heart-line text-lg"></i>
              </span>
            </div>

            <div className="space-y-3">
              {communityHighlights.map((c) => (
                <a
                  key={c.id}
                  href="/community"
                  className="block p-4 rounded-lg bg-background-50 border border-background-200 hover:border-accent-300 transition-colors cursor-pointer"
                >
                  <div className="flex gap-3">
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="w-10 h-10 rounded-full object-cover object-top"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-heading font-semibold text-foreground-950">{c.user}</span>
                        <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-800 font-semibold">
                          {c.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground-800 leading-snug">{c.title}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-foreground-600">
                        <span className="flex items-center gap-1">
                          <i className="ri-heart-line"></i>
                          {c.reactions}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-message-2-line"></i>
                          {c.replies}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <a href={communityLinks.discord} target="_blank" rel="noreferrer" className="p-3 rounded-lg bg-background-50 border border-background-200 hover:border-accent-300 text-center cursor-pointer">
                <i className="ri-discord-fill text-accent-600 text-xl"></i>
                <div className="text-[11px] font-semibold text-foreground-800 mt-1">Discord</div>
              </a>
              <a href={communityLinks.reddit} target="_blank" rel="noreferrer" className="p-3 rounded-lg bg-background-50 border border-background-200 hover:border-accent-300 text-center cursor-pointer">
                <i className="ri-reddit-line text-accent-600 text-xl"></i>
                <div className="text-[11px] font-semibold text-foreground-800 mt-1">Reddit</div>
              </a>
              <a href={communityLinks.x} target="_blank" rel="noreferrer" className="p-3 rounded-lg bg-background-50 border border-background-200 hover:border-accent-300 text-center cursor-pointer">
                <i className="ri-twitter-x-line text-accent-600 text-xl"></i>
                <div className="text-[11px] font-semibold text-foreground-800 mt-1">X / Twitter</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
