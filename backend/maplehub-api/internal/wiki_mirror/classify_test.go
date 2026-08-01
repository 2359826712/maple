package wikimirror

import "testing"

func TestClassifyPage(t *testing.T) {
	tests := []struct {
		name       string
		title      string
		categories []string
		content    string
		namespace  int
		want       string
	}{
		// Known boss titles
		{"known boss: Lucid", "Lucid", []string{"Characters", "Former Black Mage Commanders"}, "Lucid is a former commander.", 0, "bosses"},
		{"known boss: Black Mage", "Black Mage", []string{"Characters"}, "The Black Mage is the main antagonist.", 0, "bosses"},
		{"known boss: Lotus", "Lotus", []string{"Characters"}, "Lotus is a powerful boss.", 0, "bosses"},
		{"known boss: Zakum", "Zakum", []string{}, "Zakum is a classic boss.", 0, "bosses"},
		{"known boss: Guardian Angel Slime", "Guardian Angel Slime", []string{}, "Guardian Angel Slime drops.", 0, "bosses"},
		{"known boss: Chaos Zakum", "Chaos Zakum", []string{}, "Chaos Zakum is harder.", 0, "bosses"},
		{"known boss: Pink Bean", "Pink Bean", []string{}, "Pink Bean is a boss.", 0, "bosses"},
		{"known boss: Verus Hilla", "Verus Hilla", []string{}, "Verus Hilla is tough.", 0, "bosses"},

		// Story chapters should NOT be bosses
		{"story: Alliance", "(Alliance) Awakened Heroes", []string{"Alliance Quests"}, "The Maple Alliance fights the Black Mage boss.", 0, "quests"},
		{"story: Aran", "(Aran) A Hero's Deeds", []string{"Aran Quests"}, "Aran fought the Black Mage boss.", 0, "quests"},
		{"story: Aftermath", "(Aftermath) After That Day", []string{"Limina Quests"}, "After the boss battle.", 0, "quests"},
		{"story: Horntail quest", "(Horntail) The Last Hour of Horntail", []string{"Leafre Quests"}, "Heroes face Horntail boss.", 0, "quests"},
		{"story: Genesis", "(Genesis Weapon) Traces of Verus Hilla", []string{"Genesis Quests"}, "Black Mage boss created Verus Hilla.", 0, "quests"},
		{"story: Shade", "(Shade) The Fox Point Village", []string{"Shade Quests"}, "Shade remembers fighting bosses.", 0, "quests"},

		// Boss Rush should be items, not bosses
		{"boss rush: skill", "Gungnir's Descent - Boss Rush", []string{}, "Boss Rush skill.", 0, "items"},
		{"boss rush: potion", "Advanced Boss Rush Boost Potion", []string{"Items"}, "Boosts Boss Rush.", 0, "items"},

		// MediaWiki category-based
		{"cat: quests", "Quest Page", []string{"Explorer Quests"}, "A quest.", 0, "quests"},
		{"cat: npcs", "Henesys Market NPC", []string{"NPCs"}, "NPC location.", 0, "npcs"},
		{"cat: classes", "Warrior", []string{"Classes"}, "Warrior class.", 0, "classes"},
		{"cat: monsters", "Slime", []string{"Monsters"}, "Common monster.", 0, "monsters"},
		{"cat: maps", "Henesys", []string{"Maps", "Towns"}, "A town.", 0, "locations"},
		{"cat: items", "Red Potion", []string{"Items"}, "Restores HP.", 0, "items"},
		{"cat: updates", "v.230 Patch Notes", []string{"Patch Notes"}, "Update.", 0, "updates"},

		// Namespace
		{"ns6", "Image.png", []string{}, "", 6, "items"},
		{"ns14", "Category:Bosses", []string{}, "", 14, "content"},

		// Title patterns
		{"title: 5th job", "(5th Job) Call of the Erdas", []string{}, "Fifth job.", 0, "classes"},
		{"title: 6th job", "(6th Job) A New Power", []string{}, "Sixth job.", 0, "classes"},

		// Content fallback
		{"content: is a boss", "Mystery Boss", []string{}, "Mystery Boss is a boss in MapleStory.", 0, "bosses"},
		{"content: other", "Random Page", []string{}, "Just various stuff.", 0, "other"},

		// Edge cases: false positive prevention
		{"cat: Boss Reward Equipment NOT bosses", "AbsoLab Ancient Bow", []string{"Boss Reward Equipment", "Ancient Bows"}, "", 0, "items"},
		{"cat: Boss Reward Equipment → items", "AbsoLab Cape", []string{"Boss Reward Equipment", "Equipment"}, "", 0, "items"},
		{"(Pet Box) is NOT story chapter", "(Pet Box) Blackheart", []string{"Treasures", "Notices"}, "(Pet Box) Blackheart is an item.", 0, "items"},
		{"(Rare) is NOT story chapter", "(Rare) Perfect Visitor", []string{"Treasures"}, "", 0, "other"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ClassifyPage(tt.title, tt.categories, tt.content, tt.namespace)
			if got != tt.want {
				t.Errorf("ClassifyPage(%q) = %q, want %q", tt.title, got, tt.want)
			}
		})
	}
}
